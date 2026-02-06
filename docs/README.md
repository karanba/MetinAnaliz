# Metin Analiz Programı
Türkçe metin dosyalarını satır satır değil, cümle ve kelime düzeyinde analiz eder. Her kelimenin hece sayısını (sesli harf sayımıyla) çıkarır, cümle/kelime istatistiklerini yazdırır ve YOD değerini hesaplar.

## Neler üretir?
- Cümleleri numaralandırır ve her cümlenin altına kelime listesini, kelime başına hece sayısıyla birlikte yazar.
- Toplam cümle, kelime ve hece sayısını verir.
- 3, 4, 5 ve 6+ heceli kelime oranlarından YOD değerini hesaplar.

## YOD Formülü

__OKS__ = Toplam Kelime Sayısı / Toplam Cümle Sayısı  
__H3__ = 3 Heceli Kelime Sayısı / Toplam Cümle Sayısı  
__H4__ = 4 Heceli Kelime Sayısı / Toplam Cümle Sayısı  
__H5__ = 5 Heceli Kelime Sayısı / Toplam Cümle Sayısı  
__H6__ = 6 ve daha fazla heceli kelime sayısı / Toplam Cümle Sayısı  

```python
YOD = math.sqrt(OKS * ((H3 * 0.84) + (H4 * 1.5) + (H5 * 3.5) + (H6 * 26.25)))
```

## Kullanım

```powershell
python analiz.py ornekler/aa.txt > sonuclar/aa.txt
```

## API Kullanımı (FastAPI)

Uygulamayı başlat:

```powershell
uvicorn main:app
```

Örnek istek:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/analyze -ContentType "application/json" -Body '{"text":"Merhaba dünya! Bugün hava güzel mi?"}'
```

Deprem verileri:
- `GET /earthquakes` endpoint'i USGS + Kandilli (KOERI) + EMSC verilerini birleştirir.
- Her `feature.properties.source` alanı `"USGS"`, `"Kandilli"` veya `"EMSC"` değerini taşır.
- Eşleşen kayıtlar için `feature.properties.match_group` ortak bir grup etiketi içerir.
- `metadata.sources` alanında her kaynağın durum bilgisi (`ok`/`error`) bulunur.

## Frontend (Angular SPA)

Geliştirme sunucusu (proxy ile):

```powershell
cd frontend
npm install
npm run start
```

Prod build:

```powershell
cd frontend
npm run build
```

Not: Frontend, dev ortamında `/api/analyze` çağırır ve `proxy.conf.json` üzerinden `http://localhost:8000` adresine yönlenir.
Not: UI, PrimeNG v21 ve PrimeIcons kullanır; tema ve ikon stilleri `frontend/src/styles.scss` üzerinden yüklenir.
Not: Frontend ana sayfaları `/text-analyze` ve `/help` rotalarındadır.

## Uygulamayı Ayağa Kaldırma

Önerilen: sanal ortam oluşturup aktive edin.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Bağımlılıkları yükle:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Sunucuyu çalıştır:

```powershell
uvicorn main:app --reload
```

Tarayıcıdan kontrol:

```text
http://127.0.0.1:8000/docs
```

## Environment (.env) Kullanımı

Proje köküne `.env` dosyası ekleyip çalıştırma sırasında yükleyebilirsiniz.

Örnek `.env`:

```text
APP_NAME=Metin Analiz API
```

`.env` ile çalıştırma:

```powershell
uvicorn main:app --reload --env-file .env
```

## Notlar
- Hece sayımı Türkçe sesli harf kümesine göre yapılır: `AaÂâEeIıİiÎîOoÖöUuÜü`.
- Cümle bölme işlemi nokta, soru, ünlem, üç nokta ve benzeri işaretlerden sonra yapılır.
- PDF export için Unicode destekli bir TTF font gerekir. Varsayılan olarak `fonts/NotoSans-Regular.ttf` kullanılır; alternatif olarak sistem fontu (örn. Windows Arial) kullanılabilir.
- API çıktısında YOD hesaplaması için kullanılan OKS değeri `statistics.oks_value` olarak döner.
