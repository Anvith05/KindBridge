import Link from 'next/link';
import { HeartHandshake, Package, Truck, Users, ArrowRight, Shield, Zap, Globe, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ====== NAVBAR ====== */}
      <nav className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">KindBridge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors px-4 py-2">
              Log In
            </Link>
            <Link href="/auth" className="btn-primary text-sm !py-2.5 !px-6 !rounded-xl">
              Get Started <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ====== HERO ====== */}
        <section className="relative hero-mesh overflow-hidden">
          {/* Floating decorative elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-200/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-200/15 rounded-full blur-3xl animate-float delay-200" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-100/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-6 py-28 md:py-36 text-center">
            {/* Badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Real-time donation logistics platform
            </div>

            <h1 className="animate-fade-in-up delay-100 text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight max-w-5xl mx-auto">
              Connecting <span className="gradient-text">Surplus</span> with
              <br />those in <span className="gradient-text">Need</span>
            </h1>

            <p className="animate-fade-in-up delay-200 mt-8 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              KindBridge orchestrates donations from your doorstep to verified NGOs through our network of trusted volunteers—powered by live maps, OTP verification, and real-time tracking.
            </p>

            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row justify-center gap-4 mt-12">
              <Link href="/auth" className="btn-primary text-base !py-4 !px-10 !rounded-2xl inline-flex items-center gap-2">
                Start Donating <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth" className="btn-secondary text-base !py-4 !px-10 !rounded-2xl inline-flex items-center gap-2">
                Join as Volunteer <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="animate-fade-in-up delay-400 mt-20 grid grid-cols-3 max-w-lg mx-auto gap-8">
              <div>
                <div className="text-3xl font-extrabold gradient-text">10K+</div>
                <div className="text-sm text-gray-400 mt-1">Items Donated</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold gradient-text">500+</div>
                <div className="text-sm text-gray-400 mt-1">Volunteers</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold gradient-text">120+</div>
                <div className="text-sm text-gray-400 mt-1">Partner NGOs</div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== HOW IT WORKS ====== */}
        <section className="py-28 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-4">
                How It Works
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                Three steps. Infinite impact.
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
                Our streamlined process ensures every donation reaches the right hands efficiently.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="card-premium p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-[80px] -z-0 group-hover:bg-brand-100 transition-colors" />
                <div className="relative z-10">
                  <div className="text-6xl font-black text-brand-100 mb-4">01</div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mb-6 shadow-lg shadow-brand-500/20">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Donor Posts Item</h3>
                  <p className="text-gray-500 leading-relaxed">
                    Snap a photo, add details and your pickup address. Our system instantly begins matching you with nearby volunteers.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="card-premium p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[80px] -z-0 group-hover:bg-emerald-100 transition-colors" />
                <div className="relative z-10">
                  <div className="text-6xl font-black text-emerald-100 mb-4">02</div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                    <Truck className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Volunteer Picks Up</h3>
                  <p className="text-gray-500 leading-relaxed">
                    The nearest verified volunteer is notified, collects the item with OTP verification, and heads to the matched NGO.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="card-premium p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[80px] -z-0 group-hover:bg-purple-100 transition-colors" />
                <div className="relative z-10">
                  <div className="text-6xl font-black text-purple-100 mb-4">03</div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">NGO Receives</h3>
                  <p className="text-gray-500 leading-relaxed">
                    The NGO confirms delivery, the donor gets notified, and the volunteer earns badges on our leaderboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== FEATURES ====== */}
        <section className="py-28 bg-gray-50 hero-mesh">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                Built for trust & transparency
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
                Enterprise-grade features wrapped in a simple, beautiful experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Shield, title: 'OTP Verified', desc: 'Every handoff is confirmed via a secure one-time code.', color: 'brand' },
                { icon: Globe, title: 'Geo-Matching', desc: 'Smart proximity matching within 5km radius using live maps.', color: 'emerald' },
                { icon: Zap, title: 'Real-time Tracking', desc: 'Follow your donation from pickup to delivery with Socket.io.', color: 'warm' },
                { icon: Users, title: 'Role-Based Access', desc: 'Separate dashboards for Donors, Volunteers, NGOs & Admins.', color: 'rose' },
              ].map((feat, i) => (
                <div key={i} className="card-premium p-6 text-center">
                  <div className={`w-12 h-12 rounded-2xl bg-${feat.color}-50 flex items-center justify-center mx-auto mb-4`}>
                    <feat.icon className={`w-6 h-6 text-${feat.color}-600`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== CTA ====== */}
        <section className="py-28 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="card-premium p-16 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 !border-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <h2 className="text-4xl font-extrabold text-white mb-4">
                  Ready to make an impact?
                </h2>
                <p className="text-brand-200 text-lg mb-10 max-w-lg mx-auto">
                  Join thousands of donors, volunteers, and NGOs already using KindBridge to create meaningful change.
                </p>
                <Link href="/auth" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-brand-50 transition-all duration-300">
                  Create Free Account <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">KindBridge</span>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} KindBridge. Bridging communities, one donation at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
