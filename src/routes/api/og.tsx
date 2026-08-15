import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'

// CaretDoubleUp bold SVG path (Phosphor Icons, 256×256 viewBox)
const CARET_DOUBLE_UP_PATH =
  'M216.49,191.51a12,12,0,0,1-17,17L128,137,56.49,208.49a12,12,0,0,1-17-17l80-80a12,12,0,0,1,17,0Zm-160-63L128,57l71.51,71.52a12,12,0,0,0,17-17l-80-80a12,12,0,0,0-17,0l-80,80a12,12,0,0,0,17,17Z'

// Project colors (converted from oklch values in styles.css)
const colors = {
  background: '#07090b', // oklch(0.14 0.005 230)
  foreground: '#f0f2f3', // oklch(0.96 0.003 230)
  primary: '#ec5545', // oklch(0.65 0.19 29)
  mutedForeground: '#889195', // oklch(0.65 0.012 230)
  border: '#232729', // oklch(0.27 0.007 230)
}

export const Route = createFileRoute('/api/og')({
  server: {
    handlers: {
      GET: async () => {
        const title = 'Bullshit Corner'
        const subtitle =
          'A fan-built project for High Performance Racing'

        // Load IBM Plex Sans (regular 400) + Racing Sans One (400)
        const [fontRegular, fontRacing] = await Promise.all([
          fetch(
            'https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1swZSAXcomDVmadSD6llzAA.ttf',
          ).then((res) => res.arrayBuffer()),
          fetch(
            'https://fonts.gstatic.com/s/racingsansone/v17/sykr-yRtm7EvTrXNxkv5jfKKyDCwLw.ttf',
          ).then((res) => res.arrayBuffer()),
        ])

        return new ImageResponse(
          (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                width: '100%',
                height: '100%',
                padding: '60px',
                backgroundColor: colors.background,
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
                  backgroundColor: colors.primary,
                }}
              />

              {/* Logo + Title (mirrors site-header layout) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {/* Icon + Name row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                  }}
                >
                  {/* CaretDoubleUp icon */}
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 256 256"
                    fill={colors.primary}
                  >
                    <path d={CARET_DOUBLE_UP_PATH} />
                  </svg>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 56,
                        fontFamily: 'Racing Sans One',
                        color: colors.foreground,
                        lineHeight: 1.1,
                        letterSpacing: '0.025em',
                      }}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        color: colors.mutedForeground,
                        lineHeight: 1.4,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {subtitle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '40px',
                  paddingTop: '20px',
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    color: colors.mutedForeground,
                  }}
                >
                  bscorner.com
                </div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
            fonts: [
              {
                name: 'IBM Plex Sans',
                data: fontRegular,
                weight: 400,
                style: 'normal' as const,
              },
              {
                name: 'Racing Sans One',
                data: fontRacing,
                weight: 400,
                style: 'normal' as const,
              },
            ],
            headers: {
              'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            },
          },
        )
      },
    },
  },
})
