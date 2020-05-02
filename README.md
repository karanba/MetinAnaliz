# Metin Analiz Programı
Verilen metin dosyasında geçen cümleleri, kelimeleri ve heceleri analiz ederek YOD değerini bulur.

## YOD Formülü

__OKS__ = Toplam Kelime Sayısı / Toplam Cümle Sayısı

__H3__ = 3 Heceli Kelime Sayısı / Toplam Cümle Sayısı

__H4__ = 4 Heceli Kelime Sayısı / Toplam Cümle Sayısı

__H5__ = 5 Heceli Kelime Sayısı / Toplam Cümle Sayısı

__H6__ = 6 Heceli Kelime Sayısı / Toplam Cümle Sayısı

``` python
YOD = math.sqrt(OKS * ((H3 * 0.84) + (H4 * 1.5) + (H5 * 3.5) + (H6 * 26.25)))
```
## Kullanım

```
analiz.py ornekler/metin1.txt > sonuclar/metin1.txt
```