<?php


header('Content-Type: text/cache-manifest');
header('Cache-Control: no-cache');





$files = array(
'index.html',
'css/latest.jquery.mobile.min.css',
'css/images/ajax-loader.gif',
'css/images/icons-18-black.png',
'css/images/icons-18-white.png',
'css/images/icons-36-black.png',
'css/images/icons-36-white.png',
'js/bitaddress.org.js',
'js/btcbin.js',
'js/jquery.Storage.js',
'js/jquery-1.6.4.min.js',
'js/latest.jquery.mobile.min.js',
'js/strings.js');



echo "CACHE MANIFEST\n";
echo "\nCACHE:\n";


$hashes = "";
foreach($files as $file){
	$hashes += md5_file("./".$file);
	echo "/".$file."\n";
}

echo "\nNETWORK:\n";
echo '*' . "\n";


echo "\n# " . md5($hashes) . "\n";

// FOR TESTING
//echo '# ' . date("n/j/Y h:i");