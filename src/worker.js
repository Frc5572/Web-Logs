
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    // Return the generated bundled asset manifest.
    if (url.pathname === "/assets") {
      const manifestUrl = new URL("/asset-manifest.json", url.origin);
      const response = await env.ASSETS.fetch(
        new Request(manifestUrl, { method: request.method })
      );

      if (!response.ok) {
        return Response.json(
          { error: "Asset manifest not found" },
          { status: 404 }
        );
      }

      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }
    // Return the generated bundled asset manifest.
    if (url.pathname === "/logs" || url.pathname === "/logs/") {
      return Response.json(
        [],
        { status: 404 }
      );
    }

    // Map /assets/<path> to /bundledAssets/<path>.
    if (url.pathname.startsWith("/assets/")) {
      url.pathname =
        "/bundledAssets/" + url.pathname.slice("/assets/".length);

      return env.ASSETS.fetch(new Request(url, request));
    }

    // Serve static files first.
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404 || url.pathname.includes(".")) {
      return response;
    }

    // Fall back to the frontend entry point for client-side routes.
    const indexUrl = new URL("/index.html", url.origin);

    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
