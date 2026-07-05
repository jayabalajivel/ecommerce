import React from 'react';
import { 
  Leaf, 
  CookingPot, 
  ShieldCheck, 
  Heart, 
  Eye, 
  Target, 
  ChevronRight, 
  Instagram, 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles 
} from 'lucide-react';
import { Link } from 'react-router';
import { SEO } from '../../components/SEO';

import about1 from '../../assets/about_1.jpeg';
import about2 from '../../assets/about_2.jpeg';
import about3 from '../../assets/about_3.jpeg';
import about4 from '../../assets/about_4.jpeg';
import about5 from '../../assets/about_5.jpeg';

export default function CompanyPage() {
  const aboutImages = [
    about1,
    about2,
    about3,
    about4,
    about5
  ];
  const [aboutIndex, setAboutIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setAboutIndex((prev) => (prev + 1) % aboutImages.length);
    }, 3000);
  };

  React.useEffect(() => {
    if (!isPaused) {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const handleTouch = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    
    // Resume after 5 seconds of inactivity
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  return (
    <div className="bg-background min-h-screen text-foreground selection:bg-accent/30 selection:text-foreground">
      <SEO 
        title="Our Story - Madurai Madasamy Idlypodi" 
        description="Discover the heritage of Madurai Madasamy Idlypodi, preserving authentic South Indian flavours since generations with pure ingredients." 
      />

      {/* 1. Hero Section (Our Heritage) */}
      <section className="relative bg-brand-red text-white py-16 sm:py-24 overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-brand-red/95 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 z-10 text-left">
            <div className="inline-flex items-center gap-1.5 text-brand-gold font-bold text-xs tracking-[0.25em] uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" /> OUR HERITAGE
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight font-serif text-brand-gold">
              Traditional Taste of Madurai, <br />
              <span className="text-white">Crafted with Love</span>
            </h1>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
              Since our beginning, Madurai Madasamy Idly Podi has been dedicated to preserving authentic South Indian flavours. Every product is handcrafted using carefully selected ingredients, traditional recipes, and uncompromising quality standards to bring the taste of home to every family.
            </p>
            <div>
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 bg-brand-gold text-brand-red font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-white hover:text-brand-red transition-all duration-300 shadow-lg shadow-brand-gold/20 active:scale-95"
              >
                Explore Our Products <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          <div className="md:col-span-5 relative flex justify-center z-10">
            <div className="relative w-full max-w-[380px] aspect-square rounded-3xl overflow-hidden border-4 border-brand-gold/30 shadow-2xl">
              <img 
                src="https://thfvnext.bing.com/th/id/OIP.iFiyYL2EbdKudbDh5sQtswHaHP?w=160&h=180&c=7&r=0&o=7&cb=thfvnextfalcon4&dpr=1.5&pid=1.7&rm=3" 
                alt="Madurai Madasamy Idlypodi Jar" 
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Our Journey Section */}
      <section className="py-16 sm:py-24 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 md:order-1">
            <div 
              className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-border aspect-[4/3] cursor-pointer group"
              onClick={handleTouch}
              onTouchStart={handleTouch}
              onMouseEnter={handleTouch}
            >
              <img 
                src={aboutImages[aboutIndex]} 
                alt="Traditional cooking ingredients slideshow" 
                className="w-full h-full object-cover transition-all duration-700 ease-in-out transform hover:scale-105"
              />
              {isPaused && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium animate-pulse">
                  ⏸ Paused
                </div>
              )}
              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20">
                {aboutImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAboutIndex(i);
                      handleTouch();
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      aboutIndex === i ? 'bg-brand-gold w-4' : 'bg-white/50 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Stamp Card */}
            <div className="absolute -bottom-6 -right-6 bg-brand-gold text-brand-red rounded-2xl p-5 shadow-2xl border border-brand-gold/40 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-serif">35+</span>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-red/80">Years of Love</span>
            </div>
          </div>

          <div className="text-left order-1 md:order-2">
            <div className="text-brand-gold font-bold text-xs tracking-[0.25em] uppercase mb-3">
              ✦ OUR JOURNEY ✦
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-6 text-brand-red">
              Our Story
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
              Madurai Madasamy Idly Podi is a traditional food brand proudly rooted in the heart of Madurai, preserving authentic Tamil flavors for over 6 years.
We carefully source premium ingredients directly from trusted farms and prepare every batch using time-honored recipes. Each product is hand-crafted, quality-tested, and made without artificial colors, flavour ,or harmful chemicals—delivering the pure taste of homemade goodness.
From our signature Idly Podi to a wide range of traditional masalas, herbal powders, soup mixes, laddus, thokkus, and health foods, every product reflects our commitment to quality, purity, and tradition.
Today, Madurai Madasamy Idly Podi proudly serves customers across multiple states and countries, carrying forward the authentic taste that generations have trusted. Our promise remains unchanged—to deliver the rich, nostalgic flavors your grandmother would recognize, with the quality and hygiene today's families deserve.
"Traditional Taste. Pure Ingredients. Trusted for Generations.
Madurai Madasamy Idly Podi was founded with a simple mission—to preserve the authentic taste of traditional South Indian cuisine. Inspired by recipes passed down through generations, we prepare every product with care, purity, and passion.
            </p>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Our goal is to deliver the same homemade flavour that families have trusted for years. We source directly from local farms. Every batch is tested, hand-roasted, and packed with zero artificial additives to bridge traditional Tamil flavors with modern health needs.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Why Choose Us Section */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-brand-gold font-bold text-xs tracking-[0.25em] uppercase mb-3">
            ✦ WHY CHOOSE US ✦
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-12 text-brand-red">
            Purity You Can Taste
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: <Leaf className="w-7 h-7 text-brand-green" />, 
                title: '100% Natural Ingredients', 
                desc: 'No artificial colours, preservatives or additives. What you taste is nature.' 
              },
              { 
                icon: <CookingPot className="w-7 h-7 text-brand-red" />, 
                title: 'Traditional Homemade Recipe', 
                desc: 'Prepared using authentic, time-tested family recipes passed down generations.' 
              },
              { 
                icon: <ShieldCheck className="w-7 h-7 text-brand-gold" />, 
                title: 'Premium Quality', 
                desc: 'Every batch is carefully hand-graded and checked for perfect freshness and taste.' 
              },
              { 
                icon: <Heart className="w-7 h-7 text-pink-600" />, 
                title: 'Loved by Thousands', 
                desc: 'Serving happy families across Tamil Nadu and throughout India with authentic love.' 
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-card border border-border p-6 rounded-2xl hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="font-bold text-base text-foreground mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Our Vision & Our Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Vision Box */}
          <div className="bg-brand-green text-white p-8 sm:p-12 rounded-3xl relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[250px]">
            <div className="absolute right-4 top-4 opacity-10">
              <Eye className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 text-left">
              <div className="inline-flex items-center gap-1.5 text-brand-gold font-bold text-xs tracking-wider uppercase mb-4">
                ✦ OUR VISION ✦
              </div>
              <p className="text-lg sm:text-xl font-medium leading-relaxed font-serif text-white">
                To become India's most trusted traditional food brand by delivering authentic homemade flavours while preserving our culinary heritage.
              </p>
            </div>
            <div className="mt-8 text-brand-gold font-serif italic text-sm">
              Authentic & Pure Condiments
            </div>
          </div>

          {/* Mission Box */}
          <div className="bg-brand-red text-white p-8 sm:p-12 rounded-3xl relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[250px]">
            <div className="absolute right-4 top-4 opacity-10">
              <Target className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 text-left">
              <div className="inline-flex items-center gap-1.5 text-brand-gold font-bold text-xs tracking-wider uppercase mb-4">
                ✦ OUR MISSION ✦
              </div>
              <ul className="space-y-3.5 text-sm sm:text-base">
                {[
                  'Preserve traditional South Indian recipes.',
                  'Use only premium-quality ingredients.',
                  'Maintain hygiene and consistency.',
                  'Deliver fresh products directly to customers.'
                ].map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-brand-gold text-lg mt-0.5">•</span>
                    <span className="leading-tight">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 text-brand-gold font-serif italic text-sm">
              Bridging Flavours & Purity
            </div>
          </div>
        </div>
      </section>

      {/* 5. How We Make It Section */}
      <section className="py-16 sm:py-24 bg-card border-t border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-brand-gold font-bold text-xs tracking-[0.25em] uppercase mb-3">
            ✦ HOW WE MAKE IT ✦
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-16 text-brand-red">
            Our Process
          </h2>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-12 left-[10%] right-[10%] h-0.5 bg-border hidden lg:block" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              {[
                { 
                  step: '1', 
                  title: 'Finest Ingredients', 
                  desc: 'We source the best quality ingredients from trusted local farmers.',
                  image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=150&h=150&fit=crop'
                },
                { 
                  step: '2', 
                  title: 'Traditional Preparation', 
                  desc: 'Ingredients are dry roasted in small batches to bring out rich aroma and taste.',
                  image: 'https://thfvnext.bing.com/th/id/OIP.b8RNALJNOa6e8ALTzkJrsAHaHa?w=158&h=180&c=7&r=0&o=7&cb=thfvnextfalcon4&dpr=1.5&pid=1.7&rm=3'
                },
                { 
                  step: '3', 
                  title: 'Perfectly Ground', 
                  desc: 'Roasted ingredients are ground carefully to the perfect traditional texture.',
                  image: 'https://images.unsplash.com/photo-1587169710786-71e29f4e313f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG5pY2x5JTIwZ3JpbmRpbmclMjBmbG91cnxlbnwwfHwwfHx8MA%3D%3D'
                },
                { 
                  step: '4', 
                  title: 'Hygienic Packing', 
                  desc: 'Packed in clean, hygienic environment to lock freshness and native aroma.',
                  image: 'https://plus.unsplash.com/premium_photo-1661964051413-89853c6ce0d9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8aHlnZW5pYyUyMHBhY2thZ2luZ3xlbnwwfHwwfHx8MA%3D%3D'
                },
                { 
                  step: '5', 
                  title: 'Delivered to You', 
                  desc: 'From our kitchen to your home, fresh and full of authentic heritage flavour.',
                  image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150&h=150&fit=crop'
                },
              ].map((item, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center px-2 group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-5 group-hover:border-brand-gold transition-all duration-300">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-6 h-6 bg-brand-gold text-brand-red font-bold text-xs rounded-full flex items-center justify-center mb-3 shadow-md border-2 border-white">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed px-2">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Stats Section */}
      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-brand-gold font-bold text-xs tracking-[0.25em] uppercase mb-3">
            ✦ TRUSTED BY THOUSANDS OF FAMILIES ✦
          </div>
          <h2 className="text-3xl font-bold font-serif mb-12 text-brand-red">
            Our Legacy in Numbers
          </h2>

          <div className="bg-card border border-border p-8 rounded-3xl shadow-lg grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { value: 'lakhs+', label: 'Happy Customers' },
              { value: '45+', label: 'Varieties' },
              { value: '100%', label: 'Natural Ingredients' },
              { value: 'Across India', label: 'Delivery' }
            ].map((stat, idx) => (
              <div key={idx} className={`pt-6 md:pt-0 ${idx === 0 ? '' : 'pt-6 md:pt-0'} flex flex-col items-center justify-center`}>
                <span className="text-3xl sm:text-4xl font-extrabold font-serif text-brand-red mb-2">
                  {stat.value}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Contact Us & Social Links */}
      <section className="bg-brand-red text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 font-serif text-brand-gold">Get in Touch</h2>
          <p className="text-white/80 mb-10 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Have questions about our products, bulk orders, or just want to say hello? We'd love to hear from you.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            <a
              href="https://wa.me/9843430304"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10"
            >
              <MessageCircle className="w-8 h-8 text-green-400" />
              <span className="font-medium text-sm">WhatsApp</span>
            </a>
            
            <a
              href="https://www.instagram.com/madurai_madasamy_idlypodi?igsh=MTAxa2ZoemdqMDE5Nw=="
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10"
            >
              <Instagram className="w-8 h-8 text-pink-400" />
              <span className="font-medium text-sm">Instagram</span>
            </a>
            
            <a
              href="mailto:maduraimadasamyidlypodi@gmail.com"
              className="flex flex-col items-center gap-3 p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10"
            >
              <Mail className="w-8 h-8 text-blue-300" />
              <span className="font-medium text-sm">Email Us</span>
            </a>
            
            <a
              href="tel:9843430304"
              className="flex flex-col items-center gap-3 p-6 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10"
            >
              <Phone className="w-8 h-8 text-white/90" />
              <span className="font-medium text-sm">Call Us</span>
            </a>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/70 border-t border-white/10 pt-8">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-gold" /> flat no:21, pandiyan nagar 1st street, Kosakulam, Madurai, Tamil Nadu, 625017
            </div>
            <div className="hidden sm:block text-brand-gold">•</div>
            <div>Open Monday to Saturday, 9 AM - 8 PM</div>
            <div>Gst: 33DQVPM8304R1ZV</div>
            <div>fssai: 22423579000351</div>
          </div>
        </div>
      </section>
    </div>
  );
}
