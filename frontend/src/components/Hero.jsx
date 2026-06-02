import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Zap, ShieldCheck, FileText, CheckCircle, TrendingUp, Clock } from 'lucide-react'

export default function Hero() {
  const [loaded, setLoaded] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [currentImg, setCurrentImg] = useState(0)
  const heroRef = useRef(null)

  const backgroundImages = [
    '/pic-1.png',
    '/pic-2.png',
    '/pic-3.png',
    '/pic-4.png',
    '/pic-5.png',
    '/pic-6.png',
    '/pic-7.png'
  ]

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100)
    
    const interval = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % backgroundImages.length)
    }, 6000)
    
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [])

  const handleMouseMove = (e) => {
    if (!heroRef.current) return
    const { left, top, width, height } = heroRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - left) / width  - 0.5) * 20,
      y: ((e.clientY - top)  / height - 0.5) * 10,
    })
  }

  return (
    <section id="home" ref={heroRef} onMouseMove={handleMouseMove} className="relative pt-32 pb-48 flex items-center justify-center overflow-hidden scroll-mt-20">
      {/* ── Background Image Slideshow ─────────────────────── */}
      {backgroundImages.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out ${index === currentImg ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
          style={{
            backgroundImage: `url(${src})`,
            transform: `translate(${mousePos.x * 0.05}px, ${mousePos.y * 0.05}px) scale(1.05)`,
          }}
        />
      ))}

      {/* ── Overlay Layers ─────────────────────────────────── */}
      <div className="hero-overlay absolute inset-0" />
      <div className="absolute inset-0 dot-grid opacity-30" />

      {/* ── Animated Orbs ──────────────────────────────────── */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Content ────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="max-w-3xl">

          {/* Badge */}
          <div
            className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '100ms' }}
          >
            <span className="section-badge mb-6 inline-flex shadow-brand">
              <span className="w-2 h-2 bg-gold-400 rounded-full animate-ping-slow shadow-[0_0_8px_#fbbf24]" />
              KP's First Smart City Initiative
            </span>
          </div>

          {/* Main Heading */}
          <div
            className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6">
              <span className="text-white">Mardan</span>
              <br />
              <span className="gradient-text text-shadow-glow">Smart City</span>
              <br />
              <span className="text-white/90 text-4xl sm:text-5xl lg:text-6xl">Citizen Portal</span>
            </h1>
          </div>

          {/* Subtitle */}
          <div
            className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '350ms' }}
          >
            <p className="text-white/80 text-lg sm:text-xl leading-[1.7] tracking-wide mb-10 max-w-xl">
              Submit civic complaints, track resolutions in real time, and connect directly with Mardan's municipal services — all in one intelligent platform.
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className={`flex flex-wrap gap-4 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '500ms' }}
          >
            <a href="#complaints" className="btn-primary text-base px-8 py-4 group">
              <span>📝</span>
              <span>File a Complaint</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a href="#complaints" className="btn-outline text-base px-8 py-4">
              <span>🔍</span>
              <span>Track My Complaint</span>
            </a>
          </div>

          {/* Trust Badges */}
          <div
            className={`flex flex-wrap gap-6 mt-12 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '650ms' }}
          >
            {[
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, label: '24/7 Support' },
              { icon: <Zap className="w-4 h-4 text-brand-400" />, label: 'Instant Tracking' },
              { icon: <ShieldCheck className="w-4 h-4 text-purple-400" />, label: 'Secure & Private' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-white/70 text-sm tracking-wide font-medium">
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ── Floating Stats Bar ──────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card neon-border grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10 rounded-b-none rounded-t-2xl overflow-hidden transition-transform hover:-translate-y-1">
            {[
              { value: '1,248', label: 'Complaints Filed',  icon: <FileText className="w-6 h-6 text-brand-400" /> },
              { value: '986',   label: 'Resolved',          icon: <CheckCircle className="w-6 h-6 text-emerald-400" /> },
              { value: '94%',   label: 'Resolution Rate',   icon: <TrendingUp className="w-6 h-6 text-emerald-400" /> },
              { value: '48h',   label: 'Avg. Response',     icon: <Clock className="w-6 h-6 text-purple-400" /> },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors">
                {stat.icon}
                <div>
                  <p className="text-white font-bold text-lg leading-none">{stat.value}</p>
                  <p className="text-white/60 text-xs mt-1 tracking-wider uppercase">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
