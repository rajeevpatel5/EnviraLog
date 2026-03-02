Imported the DHT sensor library by Adafruit Industries
The DHT sensor library allows for the communication between the Raspberry Pi Pico 2W microprocessor and the DHT22 Temperature and Humidity sensor
This library was developed by Adafruit Industries which are well known in the IOT sector for their ease of use softwares and large collection of sensors

Firstly the pins for the sensors were defined
These are the pins on the Raspberry Pi that are connected to the data/output lines on the sensors
Pin 14 was defined as the output pin for the flamesensor
Pin 15 was defined to be the output pin for the buzzer
Pin 16 was defined to be the data line for the DHT22 sensor

The DHT library supports a few different sensors so the sensor type was also defined as a constant
Then we initialized the sensor using the library with the pin number and sensor type as the arguments for the library's constructor

Also a global variable was declared to keep track of whether a fire nearby is detected

The setup function is run once when the microprocessors boots up
The pins for the flame sensor and the buzzer were defined as input and output respectively
"dht.begin()" starts collecting data from the DHT22 sensor

"Serial.begin(9600)" starts a serial line witht the microprocessor with baud rate of 9600
"while(!Serial) { ; }" holds the execution of code util the serial monitor is connected

Loop function hold all the code that will be run repeatedly as fast as the microprocessor can process it
digitalRead is used to read the value from the flame sensor. It is 1 when a flame is detected and 0 when not
Change the fireDectected variable based on the reading from the flame sensor

If a fire is detected the alarm(buzzer) sounds and an evacuation notice is sent
Then we read the data from the DHT sensor using the library and print it to the Serial monitor

A delay of 2 second was added to delay the readings by 2 seconds since its a environment monitor and a reading every few milisecond is unreasonabe

STEPS TO RUN THE PROGRAM:
1) Compile the code in Arduino IDE
2) From the top menu select Tools
3) Select the raspberry pi pico 2W from the boards menu
4) Select the port from the tools menu. The port should be selected based on which port the microprocessor is connected to in the system
5) Upload the code to the microprocessor using the arrow pointing to the right which is the upload button in the Arduino IDE
6) After the code has been successfully flashed open serial monitor from the right hand side Serial Monitor icon
7) Then the serial monitor should start printing the current temperature and humidity in the room

PRE-REQUISITIES:
1) Raspberry Pi Pico 2W flashed using the bootsel mode for the first time
2) Install board config from the board manager in Arduino IDE
3) Install DHT library by Adafruit from the extensions 
