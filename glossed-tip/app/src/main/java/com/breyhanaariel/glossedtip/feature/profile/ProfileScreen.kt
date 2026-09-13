package com.breyhanaariel.glossedtip.feature.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ProfileScreen(padding: PaddingValues, onBookAgain: () -> Unit) {
    LazyColumn(
        modifier = Modifier.padding(padding).fillMaxSize(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Text("Your Glossed Tip", style = MaterialTheme.typography.headlineMedium)
            Text("Demo customer profile. Production uses Google or phone/OTP authentication.")
        }
        item {
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Avery Johnson", style = MaterialTheme.typography.titleLarge)
                    Text("Preferred shape: Almond")
                    Text("Preferred length: Medium")
                    Text("Notifications: Push + Email")
                    Text("Sensitivity note: Client-provided notes only; not medical advice.")
                }
            }
        }
        item {
            Text("Saved addresses", style = MaterialTheme.typography.titleLarge)
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Home • 123 Gulf View Ave, Largo, FL 33770")
                    Text("Work • 456 Central Ave, St. Petersburg, FL 33701")
                    Text("Production: add, edit, delete, label, and choose a default address through Google Places.")
                }
            }
        }
        item {
            Text("Upcoming", style = MaterialTheme.typography.titleLarge)
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Gel-X Full Set", style = MaterialTheme.typography.titleMedium)
                    Text("Long Almond • Detailed art")
                    Text("Saturday • 1:30 PM")
                    Text("Status: Confirmed")
                }
            }
        }
        item {
            Text("Recent appointment", style = MaterialTheme.typography.titleLarge)
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Structured Manicure", style = MaterialTheme.typography.titleMedium)
                    Text("Short Almond • Simple art")
                    Text("Completed")
                    Button(onClick = onBookAgain, modifier = Modifier.fillMaxWidth()) { Text("Book Again") }
                }
            }
        }
        item {
            Text("Favorites", style = MaterialTheme.typography.titleLarge)
            Text("Icy Chrome French • Berry Aura")
        }
        item {
            OutlinedButton(onClick = {}, modifier = Modifier.fillMaxWidth()) { Text("Contact Technician") }
        }
    }
}
