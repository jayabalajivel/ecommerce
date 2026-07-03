import React, { useEffect, useState } from 'react';
import { achievementsApi } from '../../lib/api';
import type { Achievement } from '../../lib/api';
import { Instagram, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { SEO } from '../../components/SEO';

export default function CompanyPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    achievementsApi.list().then(r => setAchievements(r.achievements)).catch(console.error);
  }, []);

  return (
    <div>
      <SEO title="Our Story" description="Discover the heritage of MADURAI MADASAMY IDLYPODI, bringing 35 years of pure Indian flavour from our farms to your table." />
      {/* Hero */}
      <section className="relative h-72 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1400&h=600&fit=crop&auto=format"
          alt="MADURAI MADASAMY IDLYPODI story"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 to-foreground/40" />
        <div className="absolute inset-0 flex items-center max-w-7xl mx-auto px-4 sm:px-6">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-accent font-semibold mb-3">Our Story</p>
            <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Authentic Pure<br />Indian Flavour
            </h1>
            <p className="text-white/75 max-w-lg">
              We Specialize in bringing authentic South Indian condiments directly to your table with native love.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Rooted in Heritage, <em>Driven by Purity</em>
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Madurai Madasamy Idly Podi is a traditional food manufacturing company based in the heart of Madurai.
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              We source directly from farms . Every batch is tested, hand-graded, and packed with zero artificial additives.Authentic, chemical-free herbal condiments bridging traditional Tamil flavors with modern health needs.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, MADURAI MADASAMY serves over 2 States . But our promise remains the same: the flavour your grandmother would recognise.
            </p>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1529517986296-847580704921?w=600&h=500&fit=crop&auto=format"
              alt="Spice sourcing"
              className="rounded-2xl shadow-xl w-full object-cover h-72"
            />
            <div className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground rounded-xl px-4 py-3 shadow-lg">
              <div className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>35+</div>
              <div className="text-xs opacity-80">Years of Excellence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Our Milestones</h2>
            <p className="text-muted-foreground">Numbers that reflect our commitment to quality</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map(a => (
              <div key={a.id} className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="text-3xl mb-2">{a.icon}</div>
                <div className="text-2xl font-bold text-primary mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{a.value}</div>
                <div className="text-sm font-semibold text-foreground mb-1">{a.title}</div>
                <p className="text-xs text-muted-foreground mt-auto break-words">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>What We Stand For</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: '🌿', title: '100% Natural', desc: 'No artificial colours, flavours, or preservatives. Ever. What you taste is pure nature.' },
            { icon: '🤝', title: 'Fair Trade Sourcing', desc: 'We pay fair prices to our 340+ partner farmers, ensuring sustainable livelihoods.' },
            { icon: '🔬', title: 'Lab Tested', desc: 'Every batch undergoes rigorous quality testing before it reaches your kitchen.' },
          ].map(v => (
            <div key={v.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{v.icon}</div>
              <h3 className="font-bold text-foreground text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Us & Social Links */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Get in Touch</h2>
          <p className="text-primary-foreground/80 mb-10 max-w-xl mx-auto">
            Have questions about our products, bulk orders, or just want to say hello? We'd love to hear from you.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10"
            >
              <MessageCircle className="w-8 h-8 text-green-400" />
              <span className="font-medium text-sm">WhatsApp</span>
            </a>
            
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10"
            >
              <Instagram className="w-8 h-8 text-pink-400" />
              <span className="font-medium text-sm">Instagram</span>
            </a>
            
            <a
              href="mailto:hello@spicekraft.com"
              className="flex flex-col items-center gap-3 p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10"
            >
              <Mail className="w-8 h-8 text-blue-300" />
              <span className="font-medium text-sm">Email Us</span>
            </a>
            
            <a
              href="tel:9843430304,
9345263843"
              className="flex flex-col items-center gap-3 p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10"
            >
              <Phone className="w-8 h-8 text-white/90" />
              <span className="font-medium text-sm">Call Us</span>
            </a>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-primary-foreground/70 border-t border-white/10 pt-8">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> flat no:21, pandiyan nagar 1st street, Kosakulam, Madurai, Tamil Nadu, 625017
            </div>
            <div className="hidden sm:block">•</div>
            <div>Open Monday to Saturday, 9 AM - 8 PM</div>
          </div>
        </div>
      </section>
    </div>
  );
}
