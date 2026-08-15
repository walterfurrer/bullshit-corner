import { createFileRoute } from '@tanstack/react-router'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

export const Route = createFileRoute('/api/og')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const title = url.searchParams.get('title') || 'Bullshit Corner'
        const description =
          url.searchParams.get('description') ||
          'A fan-built website inspired by the High Performance Racing podcast'

        // Load IBM Plex Sans from Google Fonts (regular 400 + bold 700)
        const [fontRegular, fontBold] = await Promise.all([
          fetch(
            'https://fonts.gstatic.com/s/ibmplexsans/v22/zYXgKVElMYYaJe8bpLHnCwDKhdHeEg.ttf',
          ).then((res) => res.arrayBuffer()),
          fetch(
            'https://fonts.gstatic.com/s/ibmplexsans/v22/zYX9KVElMYYaJe8bpLHnCwDKjWr7AIFsdA.ttf',
          ).then((res) => res.arrayBuffer()),
        ])

        const svg = await satori(
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              width: '100%',
              height: '100%',
              padding: '60px',
              backgroundColor: '#1a1a2e',
              fontFamily: 'IBM Plex Sans',
            }}
          >
            {/* Top accent bar */}
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '6px',
                backgroundColor: '#c84a20',
              }}
            />

            {/* Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  color: '#f5f5f5',
                  lineHeight: 1.1,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 28,
                  color: '#a0a0b0',
                  lineHeight: 1.4,
                }}
              >
                {description}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '40px',
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  color: '#666680',
                }}
              >
                bscorner.com
              </div>
            </div>
          </div>,
          {
            width: 1200,
            height: 630,
            fonts: [
              {
                name: 'IBM Plex Sans',
                data: fontRegular,
                weight: 400,
                style: 'normal',
              },
              {
                name: 'IBM Plex Sans',
                data: fontBold,
                weight: 700,
                style: 'normal',
              },
            ],
          },
        )

        const resvg = new Resvg(svg, {
          fitTo: { mode: 'width', value: 1200 },
        })
        const png = resvg.render().asPng()

        return new Response(new Uint8Array(png), {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        })
      },
    },
  },
})
