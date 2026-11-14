import type { MascotMood } from '../shared/types';

type LottieKeyframe = {
  t: number;
  s: number[];
  i?: { x: number[]; y: number[] };
  o?: { x: number[]; y: number[] };
};

function easeKeyframe(t: number, s: number[]): LottieKeyframe {
  return {
    t,
    s,
    i: { x: [0.42], y: [1] },
    o: { x: [0.58], y: [0] },
  };
}

function easeVecKeyframe(t: number, s: number[]): LottieKeyframe {
  const len = s.length;
  return {
    t,
    s,
    i: { x: Array(len).fill(0.42), y: Array(len).fill(1) },
    o: { x: Array(len).fill(0.58), y: Array(len).fill(0) },
  };
}

function hexToRgbNorm(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [Number(r.toFixed(3)), Number(g.toFixed(3)), Number(b.toFixed(3)), 1];
}

/**
 * Generates an authentic, multi-layer keyframed Lottie JSON animation
 * tailored to Mochi's four expressive student-finance moods.
 */
export function buildMochiLottieData(mood: MascotMood): Record<string, unknown> {
  const bodyColor = hexToRgbNorm('#74E3B1');
  const leafColor = hexToRgbNorm('#B9FF4B');
  const leafDark = hexToRgbNorm('#96DF2C');
  const eyeColor = hexToRgbNorm('#181B20');
  const blushColor = hexToRgbNorm('#FF8A8A');
  const glowColor =
    mood === 'celebrate'
      ? hexToRgbNorm('#FFD166')
      : mood === 'caution'
        ? hexToRgbNorm('#FF6B6B')
        : mood === 'coach'
          ? hexToRgbNorm('#A78BFA')
          : hexToRgbNorm('#B9FF4B');
  const darkMetal = hexToRgbNorm('#232833');

  // Mood-specific motion curves (120 frames @ 60fps = 2.0s seamless loop)
  const bodyPosKeyframes =
    mood === 'celebrate'
      ? [
          easeVecKeyframe(0, [80, 92, 0]),
          easeVecKeyframe(30, [80, 78, 0]),
          easeVecKeyframe(60, [80, 92, 0]),
          easeVecKeyframe(90, [80, 80, 0]),
          { t: 120, s: [80, 92, 0] },
        ]
      : mood === 'caution'
        ? [
            easeVecKeyframe(0, [80, 90, 0]),
            easeVecKeyframe(30, [77, 91, 0]),
            easeVecKeyframe(60, [80, 90, 0]),
            easeVecKeyframe(90, [83, 91, 0]),
            { t: 120, s: [80, 90, 0] },
          ]
        : [
            easeVecKeyframe(0, [80, 90, 0]),
            easeVecKeyframe(60, [80, 83, 0]),
            { t: 120, s: [80, 90, 0] },
          ];

  const bodyRotKeyframes =
    mood === 'caution'
      ? [
          easeKeyframe(0, [-4]),
          easeKeyframe(60, [4]),
          { t: 120, s: [-4] },
        ]
      : mood === 'celebrate'
        ? [
            easeKeyframe(0, [-5]),
            easeKeyframe(30, [5]),
            easeKeyframe(60, [-5]),
            easeKeyframe(90, [5]),
            { t: 120, s: [-5] },
          ]
        : [
            easeKeyframe(0, [0]),
            easeKeyframe(60, [2]),
            { t: 120, s: [0] },
          ];

  const leafRotKeyframes =
    mood === 'celebrate'
      ? [
          easeKeyframe(0, [-10]),
          easeKeyframe(30, [10]),
          easeKeyframe(60, [-10]),
          easeKeyframe(90, [10]),
          { t: 120, s: [-10] },
        ]
      : [
          easeKeyframe(0, [-5]),
          easeKeyframe(60, [5]),
          { t: 120, s: [-5] },
        ];

  const eyeScaleKeyframes =
    mood === 'celebrate'
      ? [
          easeVecKeyframe(0, [100, 35, 100]),
          easeVecKeyframe(60, [110, 30, 100]),
          { t: 120, s: [100, 35, 100] },
        ]
      : [
          easeVecKeyframe(0, [100, 100, 100]),
          easeVecKeyframe(52, [100, 100, 100]),
          easeVecKeyframe(56, [100, 12, 100]),
          easeVecKeyframe(60, [100, 100, 100]),
          { t: 120, s: [100, 100, 100] },
        ];

  const sparkleOpacityKeyframes = [
    easeKeyframe(0, [20]),
    easeKeyframe(30, [100]),
    easeKeyframe(60, [25]),
    easeKeyframe(90, [100]),
    { t: 120, s: [20] },
  ];

  const layers: Record<string, unknown>[] = [
    // 1. Soft Ambient Aura Ring
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'AuraGlow',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            easeKeyframe(0, [18]),
            easeKeyframe(60, [32]),
            { t: 120, s: [18] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [80, 90, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            easeVecKeyframe(0, [94, 94, 100]),
            easeVecKeyframe(60, [106, 106, 100]),
            { t: 120, s: [94, 94, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [112, 112] }, nm: 'GlowEllipse' },
            { ty: 'fl', c: { a: 0, k: glowColor }, o: { a: 0, k: 100 }, nm: 'GlowFill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
          nm: 'GlowGroup',
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },

    // 2. Mochi Sprout Body + Face + Leaves (Parented via synchronized motion)
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'MochiBody',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: bodyRotKeyframes },
        p: { a: 1, k: bodyPosKeyframes },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        // Main round clay body
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [88, 82] }, nm: 'ClayBody' },
            { ty: 'fl', c: { a: 0, k: bodyColor }, o: { a: 0, k: 100 }, nm: 'BodyFill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
          nm: 'BodyGroup',
        },
        // Left & Right tiny feet
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [-18, 38] }, s: { a: 0, k: [18, 14] }, nm: 'LeftFoot' },
            { ty: 'el', p: { a: 0, k: [18, 38] }, s: { a: 0, k: [18, 14] }, nm: 'RightFoot' },
            { ty: 'fl', c: { a: 0, k: bodyColor }, o: { a: 0, k: 100 }, nm: 'FeetFill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
          nm: 'FeetGroup',
        },
        // Arms (raised in celebrate mode, relaxed otherwise)
        {
          ty: 'gr',
          it: [
            {
              ty: 'el',
              p: { a: 0, k: mood === 'celebrate' ? [-44, -10] : [-43, 8] },
              s: { a: 0, k: [16, 22] },
              nm: 'LeftArm',
            },
            {
              ty: 'el',
              p: { a: 0, k: mood === 'celebrate' ? [44, -10] : [43, 8] },
              s: { a: 0, k: [16, 22] },
              nm: 'RightArm',
            },
            { ty: 'fl', c: { a: 0, k: bodyColor }, o: { a: 0, k: 100 }, nm: 'ArmFill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
          nm: 'ArmsGroup',
        },
        // Cheeks
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [-22, 6] }, s: { a: 0, k: [11, 7] }, nm: 'BlushL' },
            { ty: 'el', p: { a: 0, k: [22, 6] }, s: { a: 0, k: [11, 7] }, nm: 'BlushR' },
            { ty: 'fl', c: { a: 0, k: blushColor }, o: { a: 0, k: mood === 'caution' ? 25 : 55 }, nm: 'BlushFill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
          nm: 'BlushGroup',
        },
        // Mouth expression
        {
          ty: 'gr',
          it: [
            {
              ty: 'sh',
              ks: {
                a: 0,
                k:
                  mood === 'caution'
                    ? {
                        c: false,
                        v: [[-7, 10], [0, 8], [7, 10]],
                        i: [[0, 0], [-3, 0], [0, 0]],
                        o: [[0, 0], [3, 0], [0, 0]],
                      }
                    : mood === 'celebrate'
                      ? {
                          c: true,
                          v: [[-9, 4], [0, 15], [9, 4]],
                          i: [[0, -2], [-5, 0], [0, -2]],
                          o: [[0, 6], [5, 0], [0, 6]],
                        }
                      : {
                          c: false,
                          v: [[-7, 6], [0, 11], [7, 6]],
                          i: [[0, 0], [-3, 0], [0, 0]],
                          o: [[0, 0], [3, 0], [0, 0]],
                        },
              },
              nm: 'MouthPath',
            },
            ...(mood === 'celebrate'
              ? [{ ty: 'fl', c: { a: 0, k: eyeColor }, o: { a: 0, k: 100 }, nm: 'MouthFill' }]
              : [
                  {
                    ty: 'st',
                    c: { a: 0, k: eyeColor },
                    o: { a: 0, k: 100 },
                    w: { a: 0, k: 3.2 },
                    lc: 2,
                    lj: 2,
                    nm: 'MouthStroke',
                  },
                ]),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
          nm: 'MouthGroup',
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },

    // 3. Eyes Layer (blinks naturally)
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'MochiEyes',
      parent: 2,
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [0, -4, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: eyeScaleKeyframes },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [-14, 0] }, s: { a: 0, k: [9, 10] }, nm: 'EyeL' },
            { ty: 'el', p: { a: 0, k: [14, 0] }, s: { a: 0, k: [9, 10] }, nm: 'EyeR' },
            { ty: 'fl', c: { a: 0, k: eyeColor }, o: { a: 0, k: 100 }, nm: 'EyeFill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
          nm: 'EyesGroup',
        },
        ...(mood === 'coach'
          ? [
              {
                ty: 'gr',
                it: [
                  { ty: 'el', p: { a: 0, k: [-14, 0] }, s: { a: 0, k: [20, 20] }, nm: 'GlassL' },
                  { ty: 'el', p: { a: 0, k: [14, 0] }, s: { a: 0, k: [20, 20] }, nm: 'GlassR' },
                  {
                    ty: 'st',
                    c: { a: 0, k: darkMetal },
                    o: { a: 0, k: 100 },
                    w: { a: 0, k: 2.5 },
                    nm: 'GlassesFrame',
                  },
                  { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
                ],
                nm: 'GlassesGroup',
              },
            ]
          : []),
      ],
      ip: 0,
      op: 120,
      st: 0,
    },

    // 4. Twin Sprout Leaves (swaying from crown)
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: 'SproutLeaves',
      parent: 2,
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: leafRotKeyframes },
        p: { a: 0, k: [0, -40, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [-11, -10] }, s: { a: 0, k: [20, 12] }, nm: 'LeafL' },
            { ty: 'fl', c: { a: 0, k: leafDark }, o: { a: 0, k: 100 }, nm: 'LeafLFill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [-11, -10] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 28 }, o: { a: 0, k: 100 } },
          ],
          nm: 'LeftLeafGroup',
        },
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [11, -11] }, s: { a: 0, k: [22, 12] }, nm: 'LeafR' },
            { ty: 'fl', c: { a: 0, k: leafColor }, o: { a: 0, k: 100 }, nm: 'LeafRFill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [11, -11] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: -28 }, o: { a: 0, k: 100 } },
          ],
          nm: 'RightLeafGroup',
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    },
  ];

  // 5. Expression Accents (Celebration confetti stars or Coach/Caution orbital)
  if (mood === 'celebrate' || mood === 'coach' || mood === 'caution') {
    layers.push({
      ddd: 0,
      ind: 5,
      ty: 4,
      nm: 'ExpressionSparkles',
      sr: 1,
      ks: {
        o: { a: 1, k: sparkleOpacityKeyframes },
        r: {
          a: 1,
          k: [
            easeKeyframe(0, [0]),
            { t: 120, s: [mood === 'celebrate' ? 180 : 30] },
          ],
        },
        p: { a: 0, k: [80, 82, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [-54, -36] }, s: { a: 0, k: [9, 9] }, nm: 'Spark1' },
            { ty: 'el', p: { a: 0, k: [54, -32] }, s: { a: 0, k: [10, 10] }, nm: 'Spark2' },
            { ty: 'el', p: { a: 0, k: [50, 34] }, s: { a: 0, k: [7, 7] }, nm: 'Spark3' },
            { ty: 'fl', c: { a: 0, k: glowColor }, o: { a: 0, k: 100 }, nm: 'SparkFill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
          nm: 'SparklesGroup',
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
    });
  }

  return {
    v: '5.9.0',
    fr: 60,
    ip: 0,
    op: 120,
    w: 160,
    h: 160,
    nm: `mochi-${mood}`,
    ddd: 0,
    assets: [],
    layers,
  };
}
