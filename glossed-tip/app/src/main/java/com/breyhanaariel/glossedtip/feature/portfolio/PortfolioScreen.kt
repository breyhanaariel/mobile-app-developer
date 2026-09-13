package com.breyhanaariel.glossedtip.feature.portfolio

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.breyhanaariel.glossedtip.domain.model.PortfolioSet
import com.breyhanaariel.glossedtip.domain.model.SampleData
import java.text.NumberFormat
import java.util.Locale

@Composable
fun PortfolioScreen(padding: PaddingValues, onBookSet: (PortfolioSet) -> Unit) {
    val categories = listOf("All", "Freestyle", "French", "Chrome", "3D", "Character", "Seasonal", "Short", "Long")
    var category by remember { mutableStateOf("All") }
    val sets = if (category == "All") SampleData.portfolio else SampleData.portfolio.filter { category in it.tags }

    LazyColumn(
        modifier = Modifier.padding(padding).fillMaxSize(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Text("Nail Sets", style = MaterialTheme.typography.headlineMedium)
            Text("Choose a set, then customize the service, length, shape, and art before booking.")
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Filter", style = MaterialTheme.typography.titleMedium)
                categories.chunked(3).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        row.forEach { option ->
                            FilterChip(selected = category == option, onClick = { category = option }, label = { Text(option) })
                        }
                    }
                }
            }
        }
        items(sets, key = { it.id }) { set ->
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(
                        Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(18.dp)).background(MaterialTheme.colorScheme.secondaryContainer),
                        contentAlignment = Alignment.Center,
                    ) { Text("${set.title.uppercase()}\nPORTFOLIO PLACEHOLDER", style = MaterialTheme.typography.titleMedium) }
                    Text(set.title, style = MaterialTheme.typography.titleLarge)
                    Text("${set.length} ${set.shape} • ${set.artLevel.label} art")
                    Text(set.tags.joinToString(" • "))
                    Text("Estimated ${money(set.estimatedPriceCents)}", style = MaterialTheme.typography.titleMedium)
                    Button(onClick = { onBookSet(set) }, modifier = Modifier.fillMaxWidth()) { Text("Book This Set") }
                }
            }
        }
        if (sets.isEmpty()) item { Text("No demo sets are tagged $category yet.") }
    }
}

private fun money(cents: Int): String = NumberFormat.getCurrencyInstance(Locale.US).format(cents / 100.0)
