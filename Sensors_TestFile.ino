#include <DHT.h>

#define FLAMESENSOR 14
#define BUZZER 15

// DHT Sensor config
#define DHTPIN 16
#define DHTTYPE DHT22

// DHT sensor setup
DHT dht(DHTPIN, DHTTYPE);

bool fireDetected;

void setup() {
  // put your setup code here, to run once:
  pinMode(FLAMESENSOR, INPUT);
  pinMode(BUZZER, OUTPUT);

  // Initialize the temperature humidity sensor
  dht.begin();

  Serial.begin(9600);
  while(!Serial) { ; }
}

void loop() {
  // put your main code here, to run repeatedly:

  // If a fire is detected by the flame sensor it will issue an evacuation notice
  // The device will also sound the in-built alarm
  int flame = digitalRead(FLAMESENSOR);
  if(flame) {
    fireDetected = true;
  }
  else {
    fireDetected = false;
  }
  if(fireDetected) {
    Serial.println("There's a fire evacuate!");
    analogWrite(BUZZER, 124);
  }
  else {
    analogWrite(BUZZER, 0);
  }

  // Measure the temperature and humidity reading and print to screen
  Serial.print("Temperature: ");
  Serial.print(dht.readTemperature(true));
  Serial.println(" °F");
  Serial.print("Humidity: ");
  Serial.print(dht.readHumidity());
  Serial.println(" %");


  delay(2000);
}
