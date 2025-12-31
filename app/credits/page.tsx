'use client';

import Link from 'next/link';

export default function Credits() {
  return (
    <>
      <style jsx>{`
        :global(body) {
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
          background: #0a0a0c;
          color: white;
          overflow-x: hidden;
        }

        .container {
          width: 100vw !important;
          max-width: none !important;
          min-height: 100vh;
          position: relative;
          box-sizing: border-box;
        }

        /* Top Navbar */
        .top-nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          box-sizing: border-box;
          z-index: 400;
          background: rgba(10, 10, 12, 0.7);
          backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-logo {
          font-weight: 800;
          font-size: 1.4rem;
          letter-spacing: -1px;
          cursor: pointer;
          background: linear-gradient(to right, #fff, #888);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          gap: 30px;
        }

        .nav-link {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s;
        }

        .nav-link:hover {
          color: #fff;
        }

        /* Main Content */
        .main-content {
          width: 100vw !important;
          max-width: none !important;
          padding: 150px 40px 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .credits-container {
          background: #151518;
          padding: 50px 40px;
          border-radius: 24px;
          max-width: 700px;
          width: 100%;
          text-align: left;
        }

        .credits-title {
          color: #fff;
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0 0 50px 0;
          text-align: center;
          background: linear-gradient(to right, #fff, #888);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .credits-section {
          margin-bottom: 50px;
        }

        .credits-section:last-of-type {
          margin-bottom: 40px;
        }

        .credits-section-title {
          color: #8E75FF;
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0 0 25px 0;
        }

        .tech-list {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .tech-item {
          padding-bottom: 25px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .tech-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .tech-name {
          color: #fff;
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tech-desc {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .dev-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .dev-item {
          display: block;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s;
          cursor: pointer;
        }

        .dev-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .dev-name {
          color: #fff;
          font-weight: 700;
          font-size: 1.15rem;
          margin-bottom: 5px;
        }

        .dev-role {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          margin-bottom: 10px;
        }

        .dev-link {
          color: #8E75FF;
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 8px;
        }

        .dev-item:hover .dev-link {
          color: #a58fff;
        }

        .btn-glass {
          padding: 12px 24px;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
          font-family: 'Inter', sans-serif;
          text-decoration: none;
          display: inline-block;
        }

        .btn-glass:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .branding-bottom-right {
          position: fixed;
          bottom: 25px;
          right: 25px;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
          pointer-events: none;
        }
      `}</style>

      <div className="container">
        {/* Top Navbar */}
        <nav className="top-nav">
          <div className="nav-logo" onClick={() => window.location.href = '/'}>VoxTalent</div>
          <div className="nav-links">
            <Link href="/credits" className="nav-link">Credits</Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <div className="credits-container">
            <h1 className="credits-title">Credits</h1>

            {/* Powered By Section */}
            <div className="credits-section">
              <h2 className="credits-section-title">Powered By</h2>
              <div className="tech-list">
                <div className="tech-item">
                  <div className="tech-name">Google Gemini Live API</div>
                  <div className="tech-desc">
                    Advanced conversational AI for intelligent resume building and interview simulation
                  </div>
                </div>
                <div className="tech-item">
                  <div className="tech-name">
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <div style={{ width: '4px', height: '16px', borderLeft: '2px solid white', borderRight: '2px solid white' }}></div>
                      <div style={{ width: '4px', height: '16px', borderLeft: '2px solid white', borderRight: '2px solid white' }}></div>
                    </div>
                    <span>ElevenLabs</span>
                  </div>
                  <div className="tech-desc">
                    Ultra-realistic voice synthesis for natural audio interactions
                  </div>
                </div>
              </div>
            </div>

            {/* Developed By Section */}
            <div className="credits-section">
              <h2 className="credits-section-title">Developed By</h2>
              <div className="dev-list">
                <a
                  href="https://www.linkedin.com/in/halilus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dev-item"
                >
                  <div className="dev-name">Halilu Sheidu</div>
                  <div className="dev-role">Planning & Leadership</div>
                  <div className="dev-link">View LinkedIn</div>
                </a>
                <a
                  href="https://ng.linkedin.com/in/king-jethro-jerry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dev-item"
                >
                  <div className="dev-name">King Jethro</div>
                  <div className="dev-role">Logic & Development</div>
                  <div className="dev-link">View LinkedIn</div>
                </a>
              </div>
            </div>

            {/* Back Home Button */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link href="/" className="btn-glass">
                Back home
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <div className="branding-bottom-right">
          <span>Made with</span>
          <svg style={{ height: '14px', fill: '#8E75FF' }} viewBox="0 0 24 24">
            <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
          </svg>
          <span style={{ fontWeight: 700, color: 'white' }}>Gemini</span>
          <span>&</span>
          <span style={{ fontWeight: 700, color: 'white' }}>ElevenLabs</span>
        </div>
      </div>
    </>
  );
}
