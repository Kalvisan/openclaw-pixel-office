import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateZip } from "@openclaw-office/zipgen";
import type { Agent } from "@openclaw-office/core";
import type { OfficeLayout } from "@openclaw-office/zipgen";
import { IconDownload, IconCheck, IconClose } from "./Icons";
import { ASSETS, ZIP_INSTALL_GUIDE_URL } from "./assets";
import { BUILTIN_ROLES } from "./roles";
import type { RoleProfile } from "./roles";

interface Props {
  agents: Agent[];
  customRoles?: RoleProfile[];
  officeLayout?: OfficeLayout | null;
}

function enrichAgentsWithRoleProfiles(agents: Agent[], customRoles: RoleProfile[]): Agent[] {
  const roleMap = new Map<string, RoleProfile>();
  for (const r of BUILTIN_ROLES) roleMap.set(r.id, r);
  for (const r of customRoles) roleMap.set(r.id, r);

  return agents.map((a) => {
    if (!a.roleId) return a;
    const profile = roleMap.get(a.roleId);
    if (!profile) return a;
    return {
      ...a,
      roleSummary: profile.summary,
      roleResponsibilities: profile.responsibilities,
      roleWorkingStyle: profile.workingStyle,
    };
  });
}

export function DownloadZip({ agents, customRoles = [], officeLayout }: Props) {
  const [downloaded, setDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [guideMarkdown, setGuideMarkdown] = useState<string>("");
  const [guideLoading, setGuideLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showModal) {
      overlayRef.current?.focus();
    }
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;
    setGuideLoading(true);
    fetch(ZIP_INSTALL_GUIDE_URL)
      .then((r) => r.text())
      .then(setGuideMarkdown)
      .catch(() => setGuideMarkdown("# Error\nCould not load the guide. Please check the repository for instructions."))
      .finally(() => setGuideLoading(false));
  }, [showModal]);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    setShowModal(false);
    try {
      let mapAssets: { roomPng: Uint8Array; interiorsPng: Uint8Array } | undefined;
      if (officeLayout) {
        const [roomRes, interiorBlob] = await Promise.all([
          fetch(ASSETS.tiles.room).then((r) => r.arrayBuffer()),
          fetch(ASSETS.tiles.interior)
            .then((r) => r.blob())
            .then((blob) =>
              createImageBitmap(blob).then((bmp) => {
                const canvas = document.createElement("canvas");
                canvas.width = 240;
                canvas.height = 368;
                const ctx = canvas.getContext("2d")!;
                ctx.drawImage(bmp, 0, 0, 240, 368, 0, 0, 240, 368);
                return new Promise<Uint8Array>((resolve, reject) => {
                  canvas.toBlob(
                    (b) => {
                      if (!b) return reject(new Error("toBlob failed"));
                      b.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)));
                    },
                    "image/png"
                  );
                });
              })
            ),
        ]);
        mapAssets = {
          roomPng: new Uint8Array(roomRes),
          interiorsPng: interiorBlob,
        };
      }
      const enrichedAgents = enrichAgentsWithRoleProfiles(agents, customRoles);
      const zip = generateZip({
        agents: enrichedAgents,
        officeLayout: officeLayout ?? undefined,
        mapAssets,
      });
      const blob = new Blob([zip as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "openclaw-office.zip";
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  }, [agents, customRoles, officeLayout]);

  return (
    <div className="download-section">
      <button
        className={`game-btn download-btn ${downloaded ? "success" : ""}`}
        onClick={handleDownload}
        disabled={loading}
      >
        {downloaded ? (
          <>
            <IconCheck size={16} /> Downloaded!
          </>
        ) : loading ? (
          <>Generating...</>
        ) : (
          <>
            <IconDownload size={16} /> Generate & Download
          </>
        )}
      </button>
      {downloaded && !showModal && (
        <p className="download-hint">
          <button
            type="button"
            className="download-hint-link"
            onClick={() => setShowModal(true)}
          >
            What next? Click here
          </button>
        </p>
      )}

      {showModal && (
        <div
          ref={overlayRef}
          className="download-modal-overlay"
          onClick={() => setShowModal(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-modal-title"
          tabIndex={-1}
        >
          <div
            className="download-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="download-modal-header">
              <h2 id="download-modal-title" className="game-font-title">
                What to do with the ZIP file?
              </h2>
              <button
                type="button"
                className="download-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <IconClose size={20} />
              </button>
            </div>

            <div className="download-modal-body">
              {guideLoading ? (
                <p className="download-modal-loading">Loading guide...</p>
              ) : (
                <div className="download-modal-markdown">
                  <ReactMarkdown>{guideMarkdown}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
