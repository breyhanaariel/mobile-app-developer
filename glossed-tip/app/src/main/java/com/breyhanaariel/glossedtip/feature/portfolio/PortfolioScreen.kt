package com.breyhanaariel.glossedtip.feature.portfolio

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.breyhanaariel.glossedtip.domain.model.SampleData

@Composable
fun PortfolioScreen(padding: PaddingValues, onBookSet: () -> Unit) {
    LazyColumn(modifier = Modifier.padding(padding).fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { Text("Nail Sets", style = MaterialTheme.typography.headlineMedium); Text("See something you love? Book the set and customize it for you.") }
        items(SampleData.portfolio) { set ->
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(18.dp)).background(MaterialTheme.colorScheme.secondaryContainer), contentAlignment = Alignment.Center) { Text("PLACEHOLDER ART") }
                    Text(set.title, style = MaterialTheme.typography.titleLarge)
                    Text("${set.length} ${set.shape} • ${set.artLevel.name.lowercase().replaceFirstChar { it.uppercase() }} art")
                    Text("Est. $${set.estimatedPriceCents / 100}", style = MaterialTheme.typography.titleMedium)
                    Button(onClick = onBookSet, modifier = Modifier.fillMaxWidth()) { Text("Book This Set") }
                }
            }
        }
    }
}
