<?php

require_once 'vendor/google/autoload.php';

$client = new \Google_Client();
$client->setApplicationName('COURSAUXPARTICULIERS');
$client->setScopes([\Google_Service_Sheets::SPREADSHEETS]);
$client->setAccessType('offline');
$client->setAuthConfig(__DIR__ . '/servicekey.json');
$service = new Google_Service_Sheets($client);
$spreadsheetId = "1OMSN3nSNU4ba7thwK76LIXHX5KLbh5T7I8xJySYPMB0";

$range = 'Menus!A1:A5';
$response = $service->spreadsheets_values->get($spreadsheetId, $range);
$values = $response->getValues();
if (empty($values)) {
  print 'No data found.\n';
} else {
  foreach ($values as $row) {
     for ($i = 0; $i < sizeof($row); $i++) {
         echo $row[$i].'\n';
     }
  }
}
