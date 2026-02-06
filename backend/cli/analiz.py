#!/usr/bin/env python3
import re
import math
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

sesliHarfler = 'AaÂâEeIıİiÎîOoÖöUuÜü'
heceGroupları = {}

def analiz(dosyaAdi, icerik):
    icerik = icerik.replace('’','')
    toplamCumleSayısı = 0
    toplamKelimeSayısı = 0
    toplamHeceSayısı = 0

    for cumle in re.split(r'[(.+)…\?!—][\s\n]', icerik):        
        if(len(cumle) > 0):            
            toplamCumleSayısı += 1
            print('================================================')
            print(toplamCumleSayısı, ':')
            print('')
            print(cumle)

        for kelime in re.findall(r'\w+', cumle):        
            toplamKelimeSayısı+=1
            heceSayısı = heceSayisiHesapla(kelime)
            print('kelime ', toplamKelimeSayısı,' (', heceSayısı, ' hece)',  ': ', kelime)
            
            toplamHeceSayısı += heceSayısı
            if heceGroupları.get(heceSayısı) is None:
                heceGroupları[heceSayısı] = 0

            heceGroupları[heceSayısı] += 1

    print('\nMetin Analizi: ' , dosyaAdi)
    print('-------------------')
    print('Toplam Cümle Sayısı: ', toplamCumleSayısı)
    print('Toplam Kelime: ', toplamKelimeSayısı)
    print('toplamHeceSayısı: ', toplamHeceSayısı)

    H3 = 0
    H4 = 0
    H5 = 0
    H6 = 0
    OKS = toplamKelimeSayısı / toplamCumleSayısı

    for heceGrubu in sorted(heceGroupları.keys()):
        print(heceGrubu, ' heceli kelime sayısı: ', heceGroupları[heceGrubu])
        if heceGrubu == 3:
            H3 = heceGroupları[heceGrubu] / toplamCumleSayısı
        elif heceGrubu == 4:
            H4 = heceGroupları[heceGrubu] / toplamCumleSayısı
        elif heceGrubu == 5:
            H5 = heceGroupları[heceGrubu] / toplamCumleSayısı              
        elif heceGrubu >= 6:
            H6 += heceGroupları[heceGrubu] / toplamCumleSayısı            
  

    
    YOD = math.sqrt(OKS * ((H3 * 0.84) + (H4 * 1.5) + (H5 * 3.5) + (H6 * 26.25)))
    print('OKS: ', OKS)
    print('H3: ', H3)
    print('H4: ', H4)
    print('H5: ', H5)
    print('H6: ', H6)
    print('YOD: ', YOD)
    return 

def heceSayisiHesapla(kelime):
    hece = 0
    for harf in kelime:
        if sesliHarfler.find(harf) >- 1:
            hece+=1

    return hece    




def main(): 
    dosyaYolu = str(sys.argv[1])    
    file = open(dosyaYolu, mode="r", encoding="utf-8")
    dosyaİceriği = file.read()
    analiz(os.path.splitext(dosyaYolu)[0], dosyaİceriği)            
      
# Main function calling 
if __name__=="__main__":       
    main() 
