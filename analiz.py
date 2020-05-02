#!/usr/bin/env python3
import re
import math

sesliHarfler = 'AaÂâEeIıİiÎîOoÖöUuÜü'
heceGroupları = {}

def analiz(icerik):
    toplamCumleSayısı = 0
    for cumle in re.split(r'[.!?]+', icerik):
        if(len(cumle) > 0):
            toplamCumleSayısı += 1

    toplamKelimeSayısı = 0
    toplamHeceSayısı = 0
    for kelime in re.findall(r'\w+', icerik):
        toplamKelimeSayısı+=1
        heceSayısı = heceSayisiHesapla(kelime)
        if heceGroupları.get(heceSayısı) is None:
             heceGroupları[heceSayısı] = 0

        heceGroupları[heceSayısı] += 1

        toplamHeceSayısı += heceSayısı
        #print(kelime, ': ',  heceSayısı)

    print('Metin Analizi')
    print('-------------------')
    print('Toplam Cümle Sayısı: ', toplamCumleSayısı)
    print('Toplam Kelime: ', toplamKelimeSayısı)
    print('toplamHeceSayısı: ', toplamHeceSayısı)

    H3 = 0
    H4 = 0
    H5 = 0
    H6 = 0
    OKS = toplamHeceSayısı / toplamCumleSayısı

    for heceGrubu in sorted(heceGroupları.keys()):
        print(heceGrubu, ' herceli kelime sayısı: ', heceGroupları[heceGrubu])
        if heceGrubu == 3:
            H3 = heceGroupları[heceGrubu] / toplamCumleSayısı
        elif heceGrubu == 4:
            H4 = heceGroupları[heceGrubu] / toplamCumleSayısı
        elif heceGrubu == 5:
            H5 = heceGroupları[heceGrubu] / toplamCumleSayısı              
        elif heceGrubu == 6:
            H6 = heceGroupları[heceGrubu] / toplamCumleSayısı            
  

    
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
    file = open('ornek.txt', 'r')
    dosyaİceriği = file.read()
    analiz(dosyaİceriği)            
      
# Main function calling 
if __name__=="__main__":       
    main() 