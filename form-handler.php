<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false]);
    exit;
}

$to       = 'marialuis1514@gmail.com';
$type     = $_POST['form_type'] ?? 'request';
$honeypot = $_POST['website'] ?? '';

// Spam trap
if (!empty($honeypot)) {
    echo json_encode(['success' => true]);
    exit;
}

function clean($value) {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

if ($type === 'request') {
    $name    = clean($_POST['name']    ?? '');
    $email   = clean($_POST['email']   ?? '');
    $phone   = clean($_POST['phone']   ?? '');
    $address = clean($_POST['address'] ?? '');
    $service = clean($_POST['service'] ?? '');
    $message = clean($_POST['message'] ?? '');

    if (!$name || !$email || !$phone || !$service) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $subject = "New Service Request — $service | SCA Heating & Cooling";
    $body    = "NEW SERVICE REQUEST\n";
    $body   .= "===================\n\n";
    $body   .= "Name:    $name\n";
    $body   .= "Email:   $email\n";
    $body   .= "Phone:   $phone\n";
    $body   .= "Address: $address\n";
    $body   .= "Service: $service\n\n";
    $body   .= "Message:\n$message\n";

} else {
    $name    = clean($_POST['appt-name']    ?? '');
    $phone   = clean($_POST['appt-phone']   ?? '');
    $email   = clean($_POST['appt-email']   ?? '');
    $service = clean($_POST['appt-service'] ?? '');
    $date    = clean($_POST['appt-date']    ?? '');
    $time    = clean($_POST['appt-time']    ?? '');
    $address = clean($_POST['appt-address'] ?? '');
    $notes   = clean($_POST['appt-notes']   ?? '');

    if (!$name || !$phone || !$service || !$date) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $subject = "New Appointment Request — $service | SCA Heating & Cooling";
    $body    = "NEW APPOINTMENT REQUEST\n";
    $body   .= "=======================\n\n";
    $body   .= "Name:    $name\n";
    $body   .= "Phone:   $phone\n";
    $body   .= "Email:   $email\n";
    $body   .= "Service: $service\n";
    $body   .= "Date:    $date\n";
    $body   .= "Time:    $time\n";
    $body   .= "Address: $address\n\n";
    $body   .= "Notes:\n$notes\n";
}

$headers  = "From: no-reply@scahc.com\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Mail error']);
}
?>
