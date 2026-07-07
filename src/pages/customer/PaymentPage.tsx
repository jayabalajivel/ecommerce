import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Upload } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ordersApi } from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { SEO } from '../../components/SEO';
import { QRCodeSVG } from 'qrcode.react';
import logoImg from '../../assets/logo.jpg';

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_width = 800; // Limit size to 800px width
        const scale = max_width / img.width;
        
        if (img.width > max_width) {
          canvas.width = max_width;
          canvas.height = img.height * scale;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file); // Fallback to original
          }
        }, 'image/jpeg', 0.6); // 60% quality jpeg
      };
    };
  });
};

export default function PaymentPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: user?.email || '',
    door_no: '',
    street: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    payment_ref: '',
  });

  // Dynamic delivery fee calculation based on state
  const getDeliveryFee = () => {
    if (cart.length === 0) return 0;
    if (cartTotal >= 799) return 0;
    
    const stateName = (formData.state || '').trim().toLowerCase().replace(/[\s\.\-_]/g, '');
    
    // Default to ₹50 if no state is entered yet, or if it is Tamil Nadu
    if (!stateName || stateName === 'tamilnadu' || stateName === 'tn') {
      return 50;
    }
    
    // Other states: Flat ₹100
    return 100;
  };

  const deliveryFee = getDeliveryFee();
  const cgst = Math.round(cartTotal * 0.025 * 100) / 100;
  const sgst = Math.round(cartTotal * 0.025 * 100) / 100;
  const grandTotal = Math.round((cartTotal + cgst + sgst + deliveryFee) * 100) / 100;

  // Generate RAW UPI string without encoding
  const upiLink = `upi://pay?pa=mahesw1214@oksbi&pn=Maheswari&am=${grandTotal}&cu=INR`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (e.target.name === 'payment_ref') {
      value = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    }
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return setError('Screenshot must be less than 5MB');
      }
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation
    const nameTrimmed = formData.customer_name.trim();
    if (!nameTrimmed) return setError('Customer Name is required');
    if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
      return setError('Customer Name must only contain letters and spaces (no numbers or special characters)');
    }

    const phoneTrimmed = formData.phone.trim();
    if (!phoneTrimmed) return setError('Phone Number is required');
    if (!/^\d{10}$/.test(phoneTrimmed)) {
      return setError('Phone Number must be exactly 10 digits');
    }

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) return setError('Email Address is required');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return setError('Please enter a valid email address');
    }

    if (!formData.door_no.trim()) return setError('Door / Flat No is required');
    if (!formData.street.trim()) return setError('Street / Area is required');

    const cityTrimmed = formData.city.trim();
    if (!cityTrimmed) return setError('City is required');
    if (/^\d+$/.test(cityTrimmed)) return setError('City cannot be only numbers');

    const districtTrimmed = formData.district.trim();
    if (!districtTrimmed) return setError('District is required');
    if (/^\d+$/.test(districtTrimmed)) return setError('District cannot be only numbers');

    const stateTrimmed = formData.state.trim();
    if (!stateTrimmed) return setError('State is required');
    if (/^\d+$/.test(stateTrimmed)) return setError('State cannot be only numbers');

    const pincodeTrimmed = formData.pincode.trim();
    if (!pincodeTrimmed) return setError('Pincode is required');
    if (!/^\d{6}$/.test(pincodeTrimmed)) return setError('Pincode must be exactly 6 digits');

    const refTrimmed = formData.payment_ref.trim();
    if (!refTrimmed) return setError('UPI Transaction ID is required');
    if (!/^\d{12}$/.test(refTrimmed)) {
      return setError('UPI Transaction ID must be exactly 12 digits');
    }

    if (!screenshotFile) {
      return setError('Please upload your payment transaction screenshot');
    }

    setIsProcessing(true);

    try {
      let screenshot_url = undefined;
      
      // Upload screenshot first if one was selected
      if (screenshotFile) {
        let fileToUpload = screenshotFile;
        try {
          const compressedBlob = await compressImage(screenshotFile);
          fileToUpload = new File([compressedBlob], screenshotFile.name || 'screenshot.jpg', { type: 'image/jpeg' });
        } catch (compErr) {
          console.error('Image compression failed, using original file:', compErr);
        }
        const uploadRes = await ordersApi.uploadScreenshot(fileToUpload);
        screenshot_url = uploadRes.url;
      }

      // Concatenate the detailed address fields
      const fullAddress = `Door No: ${formData.door_no.trim()}, ${formData.street.trim()}, ${formData.city.trim()}, ${formData.district.trim()}, ${formData.state.trim()} - ${formData.pincode.trim()}`;

      const res = await ordersApi.create({
        items: cart.map(i => ({ id: i.id, qty: i.qty })),
        customer_name: formData.customer_name,
        email: formData.email.trim(),
        address: fullAddress,
        payment_ref: formData.payment_ref,
        screenshot_url,
        notes: `Phone: ${formData.phone}`, // Storing phone in notes as a fallback if needed
        state: formData.state.trim()
      });
      
      setPlacedOrder(res.order);
      clearCart();
    } catch (err: any) {
      setError(err.message || 'Failed to place order.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (placedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <SEO title="Order Successful" description="Your order has been placed successfully." />
        
        <div className="bg-card border border-border rounded-3xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-6 py-8 text-center text-white">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-100" />
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Payment Successful!</h2>
            <p className="text-green-100 text-lg">Your order has been placed successfully.</p>
            {placedOrder.email && (
              <p className="text-green-50/90 text-sm mt-1">A detailed receipt has been sent to <strong>{placedOrder.email}</strong></p>
            )}
          </div>

          {/* Receipt Content */}
          <div className="p-6 md:p-8 bg-white text-gray-800">
            {/* Brand Header for Printing */}
            <div className="flex flex-col items-center text-center border-b border-gray-200 pb-6 mb-6">
              <img src={logoImg} alt="Madurai Madasamy Idlypodi Logo" className="h-16 w-auto object-contain mb-3 rounded-lg border border-gray-100 p-0.5" />
              <h1 className="text-2xl font-bold text-gray-900 font-serif leading-tight">MADURAI MADASAMY IDLYPODI</h1>
              <div className="text-[11px] text-gray-500 mt-1 max-w-md">
                <strong>GST:</strong> 33DQVPM8304R1ZV | <strong>FSSAI:</strong> 22423579000351 <br/>
                <strong>Phone:</strong> 9843430304 | <strong>WhatsApp:</strong> 9843430304
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between border-b border-gray-200 pb-6 mb-6 gap-6">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Order Details</p>
                <p className="font-bold text-gray-900">Order ID: {placedOrder.id}</p>
                <p className="text-sm">Date: {new Date(placedOrder.created_at).toLocaleString()}</p>
                <p className="text-sm font-medium text-primary mt-2">UPI Txn: {placedOrder.payment_ref}</p>
              </div>
              <div className="md:text-right">
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Billed To</p>
                <p className="font-bold text-gray-900">{placedOrder.customer_name}</p>
                <p className="text-sm">+91 {placedOrder.user_phone}</p>
                {placedOrder.email && <p className="text-sm text-gray-600">{placedOrder.email}</p>}
                <p className="text-sm max-w-[200px] md:ml-auto mt-2 leading-relaxed">{placedOrder.address}</p>
              </div>
            </div>

            <div className="mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-500">
                    <th className="py-3 font-medium">Product</th>
                    <th className="py-3 font-medium text-center">Qty</th>
                    <th className="py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {placedOrder.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.weight}</p>
                      </td>
                      <td className="py-4 text-center">{item.qty}</td>
                      <td className="py-4 text-right font-medium">₹{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{placedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (2.5%)</span>
                <span>₹{(placedOrder.subtotal * 0.025).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (2.5%)</span>
                <span>₹{(placedOrder.subtotal * 0.025).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{placedOrder.delivery_fee === 0 ? 'FREE' : `₹${placedOrder.delivery_fee}`}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-gray-900 pt-4 border-t border-gray-200 mt-4">
                <span>Total Amount</span>
                <span className="text-primary">₹{placedOrder.total}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 p-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              Print Bill
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <SEO title="Secure Checkout" description="Complete your purchase securely." />
      
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Checkout</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left Side: Order Summary & QR Code */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4 text-lg">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm items-center">
                  <span className="font-medium text-foreground">{item.name} x {item.qty}</span>
                  <span className="text-muted-foreground">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>₹{cartTotal}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery</span>
                <span className={deliveryFee === 0 ? 'text-green-600 font-bold' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 text-right">
                *delivery expected 3-7 working days
              </p>
              {deliveryFee > 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                  * Tamil Nadu delivery: ₹50. Other states: ₹100.
                </p>
              )}
              <div className="flex justify-between text-sm text-muted-foreground pt-1 border-t border-border/50">
                <span>CGST (2.5%)</span><span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>SGST (2.5%)</span><span>₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border mt-3">
                <span className="font-bold text-foreground">Total Payable</span>
                <span className="text-2xl font-bold text-primary">₹{grandTotal}</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
            <h3 className="font-bold text-foreground mb-2 text-lg">Scan & Pay using UPI</h3>
            <p className="text-sm text-muted-foreground mb-4">Pay ₹{grandTotal} securely using any UPI app</p>
            
            <div className="bg-white p-4 inline-block rounded-xl border border-gray-200 mx-auto shadow-sm mb-4">
              <QRCodeSVG 
                value={upiLink} 
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            {isMobile ? (
              <button 
                type="button"
                onClick={() => { window.location.href = upiLink; }}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-95 transition-all shadow-sm mb-4"
              >
                Pay Now (Open UPI App)
              </button>
            ) : (
              <p className="text-sm font-medium text-primary mb-4 bg-primary/10 py-2 px-4 rounded-lg">
                Please scan using your mobile UPI app
              </p>
            )}
            
            <div className="flex items-center justify-center gap-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-6" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" className="h-6" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-6" />
            </div>
          </div>
        </div>

        {/* Right Side: Manual Form */}
        <div>
          <form onSubmit={handlePayment} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground mb-4 text-lg">Delivery & Payment Details</h3>
            
            {error && (
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium mb-4">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Customer Name *</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleInputChange}
                className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Enter 10-digit number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="e.g. name@domain.com"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <h4 className="text-sm font-bold text-foreground">Delivery Address</h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Door/Flat No *</label>
                  <input
                    type="text"
                    name="door_no"
                    value={formData.door_no}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="e.g. 104-B"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Street / Area *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="e.g. Spice Gardens"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="e.g. Madurai"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">District *</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="e.g. Madurai Dist"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="e.g. Tamil Nadu"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="e.g. 625001"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-1 text-primary">UPI Transaction ID *</label>
              <p className="text-xs text-muted-foreground mb-2">Enter the 12-digit reference number after paying.</p>
              <input
                type="text"
                name="payment_ref"
                value={formData.payment_ref}
                onChange={handleInputChange}
                maxLength={12}
                className="w-full p-3 rounded-xl border-2 border-primary/30 bg-primary/5 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-medium"
                placeholder="e.g. 314512345678"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Payment Screenshot *</label>
              <input
                type="file"
                id="screenshotUpload"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="screenshotUpload"
                className="block border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:bg-muted transition-colors overflow-hidden"
              >
                {screenshotPreview ? (
                  <img src={screenshotPreview} alt="Screenshot Preview" className="max-h-40 mx-auto object-contain rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                  </>
                )}
              </label>
            </div>

            <div className="flex items-start gap-2 pt-2 pb-1">
              <input
                type="checkbox"
                id="policyAgree"
                required
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
              />
              <label htmlFor="policyAgree" className="text-[11px] text-muted-foreground leading-snug cursor-pointer select-none">
                I agree to the <span className="font-semibold text-foreground">Refund & Exchange Policy</span>. I understand that items are replaced only if defective or damaged, and return shipping costs are self-paid.
              </label>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full mt-2 py-4 bg-[#1a1a1a] text-white rounded-xl font-bold text-lg hover:bg-black active:scale-[0.99] transition-all shadow-md disabled:opacity-60"
            >
              {isProcessing ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
