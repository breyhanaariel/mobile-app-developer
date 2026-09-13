package com.breyhanaariel.glossedtip.feature.profile

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ProfileScreen(padding: PaddingValues) {
    Column(modifier = Modifier.padding(padding).padding(20.dp).fillMaxSize(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("Your Glossed Tip", style = MaterialTheme.typography.headlineMedium)
        Text("Guest browsing is enabled. Sign-in will be required when booking.")
        Card {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Coming in MVP", style = MaterialTheme.typography.titleMedium)
                Text("Google sign-in • Phone/OTP • Multiple saved addresses • Appointment history • Favorites • Preferred shape/length • Client-provided allergy/sensitivity notes • Rebooking")
            }
        }
    }
}
