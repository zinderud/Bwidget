# 🌍 Real-World Scenarios

Bu klasör, Blicence Widget'ının gerçek dünya senaryolarında nasıl kullanıldığını gösteren örnekler içerir.

## �️ Teknik Detaylar

### Widget Entegrasyonu
```html
<!-- Temel entegrasyon -->
<div 
    data-producer="0x742d35Cc6634C0532925a3b8D563d7EFF3C74bA6"
    data-layout="grid"
    data-theme="light"
    data-primary-color="#667eea"
></div>
<script src="https://cdn.blicence.com/bundles/blicence-sales-widget.min.js"></script>
```

### Event Handling
```javascript
// Plan seçimi
document.addEventListener('blicence:planSelected', function(event) {
    console.log('Seçilen plan:', event.detail.name);
    // Google Analytics tracking
    gtag('event', 'plan_selected', {
        plan_name: event.detail.name,
        plan_price: event.detail.price
    });
});

// Satın alma tamamlandı
document.addEventListener('blicence:purchaseComplete', function(event) {
    console.log('Başarılı satın alma:', event.detail.txHash);
    // Conversion tracking
    gtag('event', 'purchase', {
        transaction_id: event.detail.txHash,
        value: event.detail.amount
    });
});
```

### Customization Seçenekleri

| Attribute | Type | Default | Açıklama |
|-----------|------|---------|-----------|
| `data-producer` | string | - | Producer contract adresi |
| `data-layout` | string | 'grid' | Layout tipi (grid/list/card) |
| `data-theme` | string | 'light' | Tema (light/dark/auto) |
| `data-primary-color` | string | '#667eea' | Ana renk |
| `data-secondary-color` | string | '#764ba2' | İkincil renk |
| `data-show-description` | boolean | true | Açıklamaları göster |
| `data-show-features` | boolean | true | Özellikleri göster |
| `data-show-pricing` | boolean | true | Fiyatları göster |
| `data-enable-animations` | boolean | true | Animasyonları etkinleştir |

### Responsive Design
```css
/* Widget otomatik responsive */
@media (max-width: 768px) {
    .blicence-widget {
        grid-template-columns: 1fr;
        gap: 15px;
    }
}
```

## 🚀 Kurulum ve Test

### 1. Dosyaları İndir
```bash
git clone <repository-url>
cd Bwidget/examples/real-world-scenarios
```

### 2. Local Server Başlat
```bash
# Python ile
python -m http.server 8000

# Node.js ile  
npx http-server -p 8000

# Live Server (VS Code extension)
```

### 3. Browser'da Aç
```
http://localhost:8000/index.html
```

### 4. Test Playground Kullan
```
http://localhost:8000/test-playground.html
```

## 📊 Analytics Integration

### Google Analytics 4
```javascript
// Sayfa görüntüleme
gtag('config', 'GA_MEASUREMENT_ID', {
    page_title: 'Widget Demo',
    page_location: window.location.href
});

// Custom events
gtag('event', 'widget_loaded', {
    widget_type: 'sales',
    producer_address: '0x742d35...'
});
```

### Custom Analytics
```javascript
// Özel analytics endpoint
async function trackEvent(eventName, data) {
    await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: eventName,
            timestamp: Date.now(),
            data: data
        })
    });
}
```

## 🔧 Geliştirme Rehberi

### Yeni Senaryo Ekleme

1. **HTML dosyası oluştur**
   ```html
   <!DOCTYPE html>
   <html lang="tr">
   <!-- Temel yapı -->
   ```

2. **Widget entegrasyonu**
   ```html
   <div data-producer="..." data-theme="..."></div>
   ```

3. **Custom styling**
   ```css
   .custom-theme {
       --primary-color: #your-brand-color;
   }
   ```

4. **Event handlers**
   ```javascript
   document.addEventListener('blicence:planSelected', handlePlanSelection);
   ```

### Testing Checklist
- [ ] Mobile responsive test
- [ ] Tablet responsive test  
- [ ] Desktop görünüm test
- [ ] Dark/light theme test
- [ ] Plan seçim akışı test
- [ ] Error handling test
- [ ] Loading states test
- [ ] Analytics events test

## 🎨 Design System

### Color Palette
```css
:root {
    --primary-purple: #667eea;
    --primary-orange: #ff6b6b;
    --primary-blue: #00c9ff;
    --primary-green: #92fe9d;
    
    --neutral-50: #f9fafb;
    --neutral-900: #1a202c;
}
```

### Typography
```css
.heading-1 { font-size: 2.5rem; font-weight: 700; }
.heading-2 { font-size: 2rem; font-weight: 600; }
.body-large { font-size: 1.125rem; line-height: 1.6; }
.body-small { font-size: 0.875rem; line-height: 1.5; }
```

### Spacing System
```css
.space-xs { margin: 0.5rem; }
.space-sm { margin: 1rem; }
.space-md { margin: 1.5rem; }
.space-lg { margin: 2rem; }
.space-xl { margin: 3rem; }
```

## 🚀 Production Deployment

### CDN Links
```html
<!-- Production bundles -->
<script src="https://cdn.blicence.com/bundles/blicence-sales-widget.min.js"></script>
<script src="https://cdn.blicence.com/bundles/blicence-customer-dashboard.min.js"></script>
<script src="https://cdn.blicence.com/bundles/blicence-producer-analytics.min.js"></script>
<script src="https://cdn.blicence.com/bundles/blicence-ecosystem.min.js"></script>
```

### Performance Optimization
```html
<!-- Preload kritik resources -->
<link rel="preload" href="https://cdn.blicence.com/bundles/blicence-sales-widget.min.js" as="script">

<!-- Lazy load non-critical widgets -->
<script>
window.addEventListener('load', () => {
    import('https://cdn.blicence.com/bundles/blicence-customer-dashboard.min.js');
});
</script>
```

### Security Headers
```javascript
// Content Security Policy
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' https://cdn.blicence.com;">
```

## 📞 Support & Documentation

- **Widget API Docs:** [https://docs.blicence.com/widget-api](https://docs.blicence.com/widget-api)
- **Integration Guide:** [https://docs.blicence.com/integration](https://docs.blicence.com/integration)  
- **GitHub Issues:** [Repository Issues](https://github.com/blicence/widget/issues)
- **Community Discord:** [Join Discord](https://discord.gg/blicence)

---

## 📝 Changelog

### v2.0.0 - Real-World Scenarios
- ✅ Added test playground
- ✅ Added 3 business scenario examples
- ✅ Enhanced documentation
- ✅ Added analytics integration guides
- ✅ Added responsive design system

### 📱 Ana Sayfa
**Dosya:** `index.html`
- Tüm örneklerin genel görünümü
- Teknoloji stack bilgileri
- Hızlı entegrasyon rehberi
- İnteraktif demo kartları

### 🧪 Test Playground  
**Dosya:** `test-playground.html`
- Widget konfigürasyon editörü
- Gerçek zamanlı preview
- Kod üretici
- Device simülatörü
- Event log takibi

## � Mevcut Örnekler

### 1. 📚 Online Eğitim Platformu (CodeMaster Academy)
**Dosya:** `01-education-platform.html`

Modern yazılım geliştirme eğitimleri sunan bir platform. Aylık abonelik modeli ile video derslere, canlı Q&A seanslarına ve sertifika programlarına erişim.

**Özellikler:**
- 150+ Video ders
- Canlı Q&A seansları  
- Sertifika programı
- Topluluk erişimi
- Responsive tasarım
- Purple gradient tema

### 2. 💪 Spor Salonu (FitLife Gym)
**Dosya:** `02-gym-fitness.html`

Esnek spor paketleri sunan modern fitness merkezi. Kullandıkça öde modeli ile taahhütsüz üyelik sistemi.

**Özellikler:**
- 10/20/50 girişlik paketler
- Modern ekipman erişimi
- Kişisel antrenörlük
- Grup dersleri
- Orange tema
- Fitness odaklı UX

### 3. 📊 SaaS Platformu (CloudAnalytics) 
**Dosya:** `03-saas-platform.html`

AI destekli veri analiz platformu. API erişim modeli ile kullanım bazlı fiyatlandırma sistemi.

**Özellikler:**
- 50+ ML algoritması
- Real-time analytics
- RESTful API
- Custom dashboards  
- Blue-green tech tema
- Developer-friendly UX

## 🚀 Nasıl Kullanılır

### 1. Sayfaları Açın
```bash
# Herhangi bir HTTP server ile
npx serve /mnt/sda4/code/clone/Bwidget/examples/real-world-scenarios/

# Veya Python ile
cd /mnt/sda4/code/clone/Bwidget/examples/real-world-scenarios/
python -m http.server 8080
```

### 2. Widget Script'i Dahil Edin
Her sayfada widget script'i zaten dahil edilmiştir:
```html
<script src="https://cdn.blicence.com/bundles/blicence-sales-widget.min.js"></script>
```

### 3. Event Listeners
Her senaryo için özel event handling implementasyonu:
```javascript
// Plan seçimi
document.addEventListener('blicence:planSelected', function(event) {
    const plan = event.detail;
    console.log('Plan seçildi:', plan.name);
});

// Satın alma tamamlandı
document.addEventListener('blicence:purchaseComplete', function(event) {
    const { plan, txHash } = event.detail;
    console.log('Satın alma tamamlandı:', plan.name, txHash);
});
```

## 📊 Analytics Integration

Her örnek sayfa şunları içerir:
- Google Analytics event tracking
- Custom conversion tracking
- Error monitoring
- User behavior analytics

## 🎨 Design Patterns

### Eğitim Platformu
- **Renk Şeması:** Mor-mavi gradient (#667eea → #764ba2)
- **Stil:** Modern, akademik
- **Fokus:** Öğrenci deneyimi

### Spor Salonu
- **Renk Şeması:** Turuncu-kırmızı gradient (#ff6b6b → #ff8e53)
- **Stil:** Energik, motivasyonel
- **Fokus:** Fitness yaşam tarzı

### SaaS Platformu
- **Renk Şeması:** Mavi-yeşil gradient (#00c9ff → #92fe9d)
- **Stil:** Teknolojik, profesyonel
- **Fokus:** Developer experience

## 🔧 Customization

### Widget Teması Değiştirme
```html
data-theme="dark"               <!-- Koyu tema -->
data-primary-color="#your-color" <!-- Marka rengi -->
```

### Layout Seçenekleri
```html
data-layout="grid"    <!-- Kart görünümü -->
data-layout="list"    <!-- Liste görünümü -->
data-layout="carousel" <!-- Kaydırılabilir -->
```

### Producer Bilgileri
```html
data-producer="0x..."           <!-- Producer contract address -->
data-producer-name="İşletme Adı" <!-- Görüntülenecek isim -->
data-network="polygon"          <!-- Blockchain network -->
```

## 📱 Responsive Design

Tüm örnekler mobile-first approach ile tasarlanmıştır:
- ✅ Mobile responsive
- ✅ Tablet optimized
- ✅ Desktop enhanced
- ✅ Touch-friendly interactions

## 🔍 Testing

Her senaryo için test önerileri:

1. **Plan Seçimi:** Farklı planları seç ve modal açılımlarını test et
2. **Wallet Bağlantısı:** MetaMask/WalletConnect ile test et
3. **Network Switching:** Farklı network'lere geçiş test et
4. **Error Handling:** Network hatalarını simulate et
5. **Success Flow:** Başarılı purchase flow'unu test et

## 📖 Documentation

Her senaryo için detaylı dökümanlar:
- User journey mapping
- Conversion funnel analysis
- A/B testing guidelines
- Performance optimization

---

Bu örnekler, Blicence Widget'ın gerçek dünya kullanım senaryolarında nasıl implementasyon edilebileceğini göstermektedir. Her senaryo farklı iş modelini (abonelik, kullandıkça öde, API erişim) temsil eder.
