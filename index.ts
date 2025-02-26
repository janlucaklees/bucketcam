import { spawn } from 'bun';
import { file, serve } from 'bun';

const PORT = 3000;

// Grab the camera name from command-line arguments:
// e.g., `bun index.js "USB2.0 HD UVC WebCam"`
const args = process.argv.slice(2);
const WEBCAM_NAME = args[0] || 'Integrated Camera';


const server = serve({
  port: PORT,
  // This is our HTTP request handler
  fetch(req) {
    const url = new URL(req.url);

    // Serve the main HTML page at "/"
    if (url.pathname === '/') {
      return new Response(`
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Live Bucket Cam</title>
        </head>
        <body style="margin:0; padding:0; text-align:center; background:#222;">
          <h1 style="color:#eee;">Attic Bucket Cam</h1>
          <!-- The snapshot is served from /snap -->
          <img id="cameraFeed" src="/snap" style="max-width:90%; height:auto; border: 2px solid #444;" />

          <script>
            // Refresh the snapshot once per second
            setInterval(() => {
              // Force the browser to re-request /snap by adding a timestamp query param
              document.getElementById('cameraFeed').src = '/snap?' + Date.now();
            }, 5000);
          </script>
        </body>
      </html>
      `, {
        headers: {
          'Content-Type': 'text/html'
        }
      });
    }
    // Serve a single-frame snapshot at "/snap"
    else if (url.pathname === '/snap') {
      // Spawn ffmpeg to capture a single JPEG frame from the webcam
      const ffmpeg = spawn([
        'ffmpeg',

        // On Windows with DirectShow
        '-f', 'dshow',
        '-i', `video=${WEBCAM_NAME}`,

        // Capture exactly one frame
        '-frames:v', '1',

        // Use a decent quality. Lower numbers = higher quality/larger file.
        '-q:v', '3',

        // Output format
        '-f', 'image2',

        // Write to stdout
        'pipe:1'
      ], {
        stdout: 'pipe',
        stderr: 'pipe'
      });

      // Return ffmpeg's stdout as a JPEG image response
      return new Response(ffmpeg.stdout, {
        headers: {
          'Content-Type': 'image/jpeg'
        }
      });
    }
    // Fallback for other routes
    else {
      return new Response('Not found', { status: 404 });
    }
  }
});

console.log(`Server running on http://localhost:${PORT}`);

