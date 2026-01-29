# Metin Analiz Programı
Türkçe metin dosyalarını satır satır değil, cümle ve kelime düzeyinde analiz eder. Her kelimenin hece sayısını (sesli harf sayımıyla) çıkarır, cümle/kelime istatistiklerini yazdırır ve YOD değerini hesaplar.

## Neler üretir?
- Cümleleri numaralandırır ve her cümlenin altına kelime listesini, kelime başına hece sayısıyla birlikte yazar.
- Toplam cümle, kelime ve hece sayısını verir.
- 3, 4, 5 ve 6 heceli kelime oranlarından YOD değerini hesaplar.

## YOD Formülü

__OKS__ = Toplam Kelime Sayısı / Toplam Cümle Sayısı  
__H3__ = 3 Heceli Kelime Sayısı / Toplam Cümle Sayısı  
__H4__ = 4 Heceli Kelime Sayısı / Toplam Cümle Sayısı  
__H5__ = 5 Heceli Kelime Sayısı / Toplam Cümle Sayısı  
__H6__ = 6 Heceli Kelime Sayısı / Toplam Cümle Sayısı  

```python
YOD = math.sqrt(OKS * ((H3 * 0.84) + (H4 * 1.5) + (H5 * 3.5) + (H6 * 26.25)))
```

## Kullanım

```powershell
python analiz.py ornekler/aa.txt > sonuclar/aa.txt
```

## Notlar
- Hece sayımı Türkçe sesli harf kümesine göre yapılır: `AaÂâEeIıİiÎîOoÖöUuÜü`.
- Cümle bölme işlemi nokta, soru, ünlem, üç nokta ve benzeri işaretlerden sonra yapılır.
