<?php
// Tarayıcıların CORS (Güvenlik) engeline takılmamak için izin veriyoruz
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

// Barkod gelmediyse işlemi durdur
if (!isset($_GET['barkod'])) {
    die(json_encode(['error' => 'Barkod gerekli']));
}

$barkod = $_GET['barkod'];
// ÜTS Vatandaş Sorgulama Gizli API Linki
$url = "https://utsuygulama.saglik.gov.tr/rest/bilgi/urun/sorgula?barkod=" . $barkod;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // SSL Hatalarını Yoksay

// İŞTE SİHRİN OLDUĞU YER: Bot olduğumuzu gizleyip gerçek bir Chrome gibi davranıyoruz
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json, text/plain, */*',
    'Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection: keep-alive',
    'Referer: https://utsuygulama.saglik.gov.tr/UTS/vatandas'
]);

// İsteği gönder ve cevabı al
$response = curl_exec($ch);
curl_close($ch);

// Sağlık Bakanlığından gelen orijinal veriyi senin sistemine gönder
echo $response;
?>