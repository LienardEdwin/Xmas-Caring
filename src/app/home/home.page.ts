import { Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { AlertController} from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import {HttpClient} from '@angular/common/http';

declare var google;

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

    map: any;
    latitude: number;
    longitude: number;
    centrales: any;
    features: any;
    points;
    @ViewChild('mapElement', {static: false}) mapNativeElement: ElementRef;

    constructor(private geolocation: Geolocation,
                private http: HttpClient,
                public alertController: AlertController,
        ) {
    }

    ngOnInit() {
        this.initMap();
    }

    async initMap() {
        await this.geolocation.getCurrentPosition().then((resp) => {
            this.latitude = resp.coords.latitude;
            this.longitude = resp.coords.longitude;
        }).catch((error) => {
            console.log('Error getting location', error);
        });
        // In setView add latLng and zoom
        this.map = new google.maps.Map(this.mapNativeElement.nativeElement, {
            center: {lat: 35.6828387, lng: 139.7594549},
            disableDefaultUI: true,
            zoomControl: true,
            zoom: 6
        });

        const myLatlng = new google.maps.LatLng(this.latitude, this.longitude);
        const marker = new google.maps.Marker({
            position: myLatlng,
            title: 'Ma localisation'
        });
        marker.setMap(this.map);
        this.map.data.loadGeoJson(
            '../assets/departements-version-simplifiee.geojson');
        const icons = {
            central: {
                icon: '../assets/icon/icon-nuclear.png'
            }
        };
        const features = [];
        this.getCentrales(features).then( locations => {
            this.features = locations;
            for (let i = 0; i < this.features.length; i++) {
                const markerCentral = new google.maps.Marker({
                    position: features[i].position,
                    icon: icons[features[i].type].icon,
                });
                markerCentral.setMap(this.map);
            }
        });

        this.getAreaHazard(){
            for (let i = 0; i < this.features.length; i++) {
                const markerCentral = new google.maps.Marker({
                    position: features[i].position,
                    icon: icons[features[i].type].icon,
                });
                markerCentral.setMap(this.map);
            }
        }

        const caption = {
            nuke: {
                name: 'Centrale Nucléaire',
                icon: ' ./assets/icon/icon-nuclear.png'
            },
        };


        const legend = document.getElementById('legend');
        for (const key in caption) {
            const type = caption[key];
            const name = type.name;
            const icon = type.icon;
            const div = document.createElement('div');
            div.innerHTML =
                '<img style="vertical-align: middle; width: 32px; height: 32px; padding: 3px" src="' + icon + '"> ' + name;
            legend.appendChild(div);
        }

        this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(legend);
        this.map.data.setStyle(this.styleFeature);

    }


    getCentrales(array) {
        return new Promise((resolve => {
            this.http.get('./assets/liste-centrales-nucleaires.geojson').subscribe( data => {
                this.centrales = data;
                for (let i = 0; i < this.centrales.features.length; i++) {
                    array.push(
                        {
                            position: new google.maps.LatLng(
                                parseFloat(this.centrales.features[i].properties['Commune Lat']),
                                parseFloat(this.centrales.features[i].properties['Commune long'])
                            ),
                            type: 'central'
                        }
                    );
                }
                resolve(array);
            });
        }));
    }

    getAreaHazard(){
        this.map.data.loadGeoJson(
            '../assets/areaHazard.geojson');
    }

     styleFeature(feature) {
        const low = [151, 83, 34];   // color of mag 1.0
        const high = [5, 69, 54];  // color of mag 6.0 and above
        const minMag = 1.0;
        const maxMag = 6.0;

        // fraction represents where the value sits between the min and max
        const fraction = (Math.min(feature.getProperty('mag'), maxMag) - minMag) /
            (maxMag - minMag);

        const color = this.interpolateHsl(low, high, fraction);

        return {
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                strokeWeight: 0.5,
                strokeColor: '#fff',
                fillColor: color,
                fillOpacity: 2 / feature.getProperty('mag'),
                // while an exponent would technically be correct, quadratic looks nicer
                scale: Math.pow(feature.getProperty('mag'), 2)
            },
            zIndex: Math.floor(feature.getProperty('mag'))
        };
    }

     interpolateHsl(lowHsl, highHsl, fraction) {
        const color = [];
        for (let i = 0; i < 3; i++) {
            // Calculate color based on the fraction.
            color[i] = (highHsl[i] - lowHsl[i]) * fraction + lowHsl[i];
        }

        return 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)';
    }

}
