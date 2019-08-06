<!-- <?php 
// if(isset($_POST['submit'])){
    // $to = "t-ibabou@microsoft.com"; // this is your Email address
    // $from = $_POST['email']; // this is the sender's Email address
    // $first_name = $_POST['firstname'];
    // $last_name = $_POST['lastname'];
    // $subject = "Form submission";
    // $subject2 = "Copy of your form submission";
    // $message = $first_name . " " . $last_name . " wrote the following:" . "\n\n" . $_POST['message'];
    // $message2 = "Here is a copy of your message " . $first_name . "\n\n" . $_POST['message'];

    // $headers = "From:" . $from;
    // $headers2 = "From:" . $to;
    // mail($to,$subject,$message,$headers);
    // mail($from,$subject2,$message2,$headers2); // sends a copy of the message to the sender
    // echo "Mail Sent. Thank you " . $first_name . ", we will contact you shortly.";
    // }
// ?> -->

<?php
if (isset($_POST["submit"])) {
$firstname = $_POST['firstname'];
$email = $_POST['email'];
$message = $_POST['message'];
$subject = $_POST['topic'];

$content="From: $name \n Email: $email \n Message: $message";
$recipient = "t-ibabou@microsoft.com";
$mailheader = "From: $email \r\n";
mail($recipient, $subject, $content, $mailheader) or die("Error!");
echo "Email sent!";
}
?>