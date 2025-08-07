<?php
$csvFile = 'giveaway_entries.csv';

$name = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
$email = isset($_POST['email']) ? strip_tags(trim($_POST['email'])) : '';
$ytHandle = isset($_POST['ytHandle']) ? strip_tags(trim($_POST['ytHandle'])) : '';
$why = isset($_POST['why']) ? strip_tags(trim($_POST['why'])) : '';

// Skip file input (we don't process it in this PHP version)

if ($name && $email && $ytHandle && $why) {
    $row = [
        date("Y-m-d H:i:s"),
        $name,
        $email,
        $ytHandle,
        $why
    ];

    $file = fopen($csvFile, 'a');
    if ($file !== false) {
        fputcsv($file, $row);
        fclose($file);
        echo "success";
    } else {
        echo "Error writing to CSV.";
    }
} else {
    echo "All fields are required.";
}
?>
