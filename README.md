# Pirple Homework #2

It is time to build a simple frontend for the Pizza-Delivery API you created in Homework Assignment #2. Please create a web app that allows customers to:

1. Signup on the site

2. View all the items available to order

3. Fill up a shopping cart

4. Place an order (with fake credit card credentials), and receive an email receipt

This is an open-ended assignment. You can take any direction you'd like to go with it, as long as your project includes the requirements. It can include anything else you wish as well. 

## Documentation
API Documentation is in `/doc` folder

### Create Certificate for HTTPS Server
Run the following commands to create the certificate files needed to start the HTTPS server. If these files are not present only the HTTP server will start
```
mkdir https
cd https
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
```
