import { useCallback, useState } from "react";
import { generateZip } from "@openclaw-office/zipgen";
import type { Agent } from "@openclaw-office/core";
import type { OfficeLayout } from "@openclaw-office/zipgen";
import { IconDownload, IconCheck } from "./Icons";

interface Props {
  agents: Agent[];
  officeLayout?: OfficeLayout | null;
}

export function DownloadZip({ agents, officeLayout }: Props) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = useCallback(() => {
    const zip = generateZip({ agents, officeLayout: officeLayout ?? undefined });
    const blob = new Blob([new Uint8Array(zip)], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "openclaw-office.zip";
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }, [agents, officeLayout]);

  return (
    <div className="download-section">
      <button
        className={`game-btn download-btn ${downloaded ? "success" : ""}`}
        onClick={handleDownload}
      >
        {downloaded ? (
          <>
            <IconCheck size={16} /> Downloaded!
          </>
        ) : (
          <>
            <IconDownload size={16} /> Generate & Download
          </>
        )}
      </button>
      {downloaded && <p className="download-hint">Ready to deploy your office!</p>}
    </div>
  );
}
