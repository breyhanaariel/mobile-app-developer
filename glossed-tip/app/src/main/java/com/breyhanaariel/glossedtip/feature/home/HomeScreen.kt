package com.breyhanaariel.glossedtip.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp

@Composable
fun HomeScreen(padding: PaddingValues, onBook: () -> Unit, onPortfolio: () -> Unit) {
    Column(
        modifier = Modifier.padding(padding).padding(20.dp).fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Spacer(Modifier.height(8.dp))
        Text("GLOSSED TIP", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
        Text("Luxury nails,\nwherever you are.", style = MaterialTheme.typography.displaySmall)
        Text("A mobile nail experience by Maya Brooks. Browse signature sets, choose your service, and book an appointment at your location.", style = MaterialTheme.typography.bodyLarge)
        Box(Modifier.fillMaxWidth().height(190.dp).clip(RoundedCornerShape(28.dp)).background(MaterialTheme.colorScheme.primaryContainer), contentAlignment = Alignment.Center) { Text("PLACEHOLDER\nNAIL ART HERO", style = MaterialTheme.typography.titleLarge) }
        Button(onClick = onBook, modifier = Modifier.fillMaxWidth().height(54.dp)) { Text("Book an Appointment") }
        OutlinedButton(onClick = onPortfolio, modifier = Modifier.fillMaxWidth().height(54.dp)) { Text("Browse Nail Sets") }
        Text("Mobile appointments", style = MaterialTheme.typography.titleMedium)
        Text("Your address is checked before booking so you only see appointment times Maya can realistically travel to.")
    }
}
