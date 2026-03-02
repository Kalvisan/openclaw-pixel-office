/**
 * Office Viewer - lightweight 2D tilemap viewer using PixiJS.
 * Pluggable engine: swap PixiJS for Three.js, Phaser, etc. as needed.
 *
 * Loads TMX map from /assets/officemap.tmx (run scripts to generate).
 */
import { Application, Assets, extensions } from "pixi.js";
import { tiledMapLoader } from "pixi-tiledmap";

extensions.add(tiledMapLoader);

const app = new Application();

async function init() {
  await app.init({
    background: "#0a0a0f",
    resizeTo: window,
    resolution: window.devicePixelRatio ?? 1,
    autoDensity: true,
  });

  const container = document.getElementById("app");
  if (container) container.appendChild(app.canvas);

  try {
    const { container: mapContainer } = await Assets.load("/assets/officemap.tmx");
    app.stage.addChild(mapContainer);
    // Center map in viewport
    mapContainer.x = (app.screen.width - mapContainer.width) / 2;
    mapContainer.y = (app.screen.height - mapContainer.height) / 2;
  } catch (err) {
    console.warn("Map not found. Run: pnpm generate-officemap && pnpm stitch-modern-office", err);
    // Fallback: draw simple placeholder
    const { Graphics } = await import("pixi.js");
    const g = new Graphics();
    g.rect(0, 0, 320, 240);
    g.fill("#1a1a24");
    g.rect(10, 10, 300, 220);
    g.fill("#252530");
    g.roundRect(140, 100, 40, 40, 4);
    g.fill("#3a3a48");
    app.stage.addChild(g);
    g.x = (app.screen.width - 320) / 2;
    g.y = (app.screen.height - 240) / 2;
  }
}

init().catch(console.error);
