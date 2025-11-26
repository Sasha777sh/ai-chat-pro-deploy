'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DomePage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Проверяем, что это твой email (замени на свой)
      const allowedEmails = ['sanecek@example.com']; // ЗАМЕНИ НА СВОЙ EMAIL
      
      if (!allowedEmails.includes(session.user.email || '')) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Проверка доступа...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <DomeVisualization />;
}

function DomeVisualization() {
  const [base, setBase] = useState(5500);
  const [height, setHeight] = useState(3300);
  const [clay, setClay] = useState(10);
  const [chambers, setChambers] = useState(10);

  useEffect(() => {
    updateVisualization();
  }, [base, height, clay, chambers]);

  const updateVisualization = () => {
    const scale = 1200 / 7000;
    const pxBase = base * scale;
    const pxHeight = height * scale;
    const cx = 600;
    const groundY = 560;
    const topY = groundY - pxHeight;
    const leftX = cx - pxBase / 2;
    const rightX = cx + pxBase / 2;

    const c1x = leftX + pxBase * 0.12;
    const c1y = groundY - pxHeight * 0.44;
    const mid1x = cx - pxBase * 0.15;
    const mid1y = groundY - pxHeight * 0.74;
    const mid2x = cx + pxBase * 0.15;
    const mid2y = mid1y;
    const c2x = rightX - pxBase * 0.12;
    const c2y = c1y;

    const path = `M ${leftX} ${groundY} C ${c1x} ${c1y}, ${mid1x} ${mid1y}, ${cx} ${topY} C ${mid2x} ${mid2y}, ${c2x} ${c2y}, ${rightX} ${groundY} L ${leftX} ${groundY} Z`;
    const path2 = `M ${leftX - 20} ${groundY} C ${c1x - 10} ${c1y + 8}, ${mid1x - 6} ${mid1y - 8}, ${cx} ${topY - 8} C ${mid2x + 6} ${mid2y - 8}, ${c2x + 10} ${c2y + 8}, ${rightX + 20} ${groundY} L ${leftX - 20} ${groundY} Z`;

    const domePath = document.getElementById('domePath');
    const clayLayer = document.getElementById('clayLayer');
    const equator = document.getElementById('equator');
    const baseBand = document.getElementById('baseBand');
    const slicePath = document.getElementById('slicePath');

    if (domePath) domePath.setAttribute('d', path);
    if (clayLayer) clayLayer.setAttribute('d', path2);
    if (equator) {
      equator.setAttribute('x1', String(cx - pxBase * 0.6));
      equator.setAttribute('x2', String(cx + pxBase * 0.6));
      equator.setAttribute('y1', String(groundY - pxHeight * 0.55));
      equator.setAttribute('y2', String(groundY - pxHeight * 0.55));
    }
    if (baseBand) {
      baseBand.setAttribute('x', String(leftX));
      baseBand.setAttribute('width', String(pxBase));
      baseBand.setAttribute('y', String(groundY - 20));
    }
    if (slicePath) {
      const sliceScale = 360 / pxBase;
      const sliceBase = pxBase * sliceScale;
      const sliceHeight = pxHeight * sliceScale;
      const slicePathStr = `M ${50} ${170} C ${95} ${170 - sliceHeight * 0.3}, ${160} ${170 - sliceHeight * 0.6}, ${240} ${170 - sliceHeight * 0.7} C ${320} ${170 - sliceHeight * 0.6}, ${350} ${170 - sliceHeight * 0.3}, ${305} ${170}`;
      slicePath.setAttribute('d', slicePathStr);
    }
  };

  const exportSVG = () => {
    const svg = document.getElementById('canvas');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const src = '<?xml version="1.0" standalone="no"?>\n' + serializer.serializeToString(svg);
    const blob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edem_dome_profile.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ fontFamily: 'Inter, Roboto, Arial, sans-serif', background: '#f6f6f7', color: '#222', margin: 0, padding: '20px', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '18px', margin: '0 0 10px' }}>
        EDEM — инженерная форма купола для формовки глины
      </h1>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 6px 18px rgba(10,10,20,0.06)', flex: '1.6', minWidth: '600px' }}>
          <svg
            id="canvas"
            viewBox="0 0 1200 700"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: 'auto' }}
          >
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="#000" floodOpacity="0.12" />
              </filter>
            </defs>

            {/* ground */}
            <rect x="0" y="560" width="1200" height="140" fill="#eef2f5" />

            {/* central dome silhouette */}
            <path
              id="domePath"
              d="M150 560 C 230 420, 330 300, 600 260 C 870 300, 970 420, 1050 560 L 150 560 Z"
              fill="#e9d6bf"
              stroke="#b58f6b"
              strokeWidth="3"
              filter="url(#shadow)"
            />

            {/* clay layer outside (visual) */}
            <path
              id="clayLayer"
              d="M130 560 C 210 410, 320 285, 600 248 C 880 285, 990 410, 1070 560 L 130 560 Z"
              fill="rgba(160,110,60,0.12)"
            />

            {/* equator line */}
            <line
              id="equator"
              x1="300"
              y1="360"
              x2="900"
              y2="360"
              stroke="#5a4a3c"
              strokeDasharray="6 6"
              strokeWidth="1.6"
            />

            {/* base straight band */}
            <rect
              id="baseBand"
              x="150"
              y="540"
              width="900"
              height="20"
              fill="#d2b89b"
              opacity="0.9"
            />

            {/* measurements */}
            <line x1="150" y1="580" x2="1050" y2="580" stroke="#333" strokeWidth="1" />
            <text x="600" y="600" textAnchor="middle" fontSize="16" fill="#333">
              База: {base} mm (масштаб)
            </text>

            {/* vertical centerline and height marker */}
            <line x1="600" y1="560" x2="600" y2="260" stroke="#333" strokeDasharray="4 4" />
            <text x="620" y="260" fontSize="14" fill="#333">
              Высота: {height} mm
            </text>

            {/* cross-section inset */}
            <g transform="translate(40,30)">
              <rect x="0" y="0" width="360" height="200" fill="#fff" stroke="#eee" rx="8" />
              <text x="12" y="18" fontSize="13" fill="#333">
                Вертикальный разрез
              </text>
              <path
                id="slicePath"
                d="M50 170 C 95 120, 160 60, 240 50 C 320 60, 350 120, 305 170"
                fill="#e9d6bf"
                stroke="#b58f6b"
                strokeWidth="2"
              />
              <line x1="190" y1="170" x2="190" y2="50" stroke="#333" strokeDasharray="3 3" />
              <text x="196" y="40" fontSize="12" fill="#333">
                Экватор: самая широкая
              </text>
            </g>

            {/* top-down plan inset */}
            <g transform="translate(760,30)">
              <rect x="0" y="0" width="380" height="200" fill="#fff" stroke="#eee" rx="8" />
              <text x="12" y="18" fontSize="13" fill="#333">
                План сверху
              </text>
              <ellipse cx="190" cy="110" rx="140" ry="120" fill="#f3efe9" stroke="#b58f6b" strokeWidth="2" />
              <circle cx="190" cy="110" r="34" fill="#d9c1a3" />
              <text x="190" y="200" fontSize="12" fill="#333" textAnchor="middle">
                Диаметр экватора — {base} mm
              </text>
            </g>

            {/* annotations */}
            <g>
              <rect x="40" y="580" width="320" height="100" rx="10" fill="#fff" stroke="#eee" />
              <text x="60" y="600" fontSize="13" fill="#333">
                Принципы формы:
              </text>
              <text x="60" y="617" fontSize="12" fill="#555">
                • Середина — самая широкая (экватор)
              </text>
              <text x="60" y="634" fontSize="12" fill="#555">
                • Верх — сужается (арочная опора)
              </text>
              <text x="60" y="651" fontSize="12" fill="#555">
                • Низ — ровный/слегка расширенный для опоры
              </text>
            </g>
          </svg>

          <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
            Параметры визуализации масштабированы для экрана. В холсте — точный профиль, который мы экспортируем в DXF/SVG при необходимости.
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 6px 18px rgba(10,10,20,0.06)', flex: '1', maxWidth: '320px' }}>
          <label style={{ display: 'block', margin: '8px 0 4px', fontSize: '13px', color: '#555' }}>
            База (мм) — <span>{base}</span>
          </label>
          <input
            type="range"
            min="3000"
            max="8000"
            value={base}
            step="100"
            onChange={(e) => setBase(Number(e.target.value))}
            style={{ width: '100%' }}
          />

          <label style={{ display: 'block', margin: '8px 0 4px', fontSize: '13px', color: '#555' }}>
            Высота (мм) — <span>{height}</span>
          </label>
          <input
            type="range"
            min="1800"
            max="4200"
            value={height}
            step="50"
            onChange={(e) => setHeight(Number(e.target.value))}
            style={{ width: '100%' }}
          />

          <label style={{ display: 'block', margin: '8px 0 4px', fontSize: '13px', color: '#555' }}>
            Толщина глины (см) — <span>{clay}</span>
          </label>
          <input
            type="range"
            min="6"
            max="14"
            value={clay}
            step="1"
            onChange={(e) => setClay(Number(e.target.value))}
            style={{ width: '100%' }}
          />

          <label style={{ display: 'block', margin: '8px 0 4px', fontSize: '13px', color: '#555' }}>
            Количество воздушных камер — <span>{chambers}</span>
          </label>
          <input
            type="range"
            min="6"
            max="14"
            value={chambers}
            step="1"
            onChange={(e) => setChambers(Number(e.target.value))}
            style={{ width: '100%' }}
          />

          <div style={{ fontSize: '13px', color: '#333', marginTop: '8px' }}>
            <b>Рекомендации:</b>
            <ul>
              <li>Экватор — несущая зона: не сужать вниз.</li>
              <li>Нижняя полоса (band) — учитывайте армирование и точки крепления.</li>
              <li>Текстура для сцепления и PE-плёнка для съёма (release film).</li>
            </ul>
          </div>

          <button
            onClick={exportSVG}
            style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#0b76ef',
              color: '#fff',
              textDecoration: 'none',
              marginTop: '10px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Экспорт SVG
          </button>

          <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
            Нажмите «Экспорт SVG», чтобы сохранить вектор для передачи фабрике (включая профиль).
          </div>
        </div>
      </div>
    </div>
  );
}

