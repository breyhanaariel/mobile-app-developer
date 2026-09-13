package com.breyhanaariel.glossedtip.feature.booking

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.breyhanaariel.glossedtip.domain.model.*
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingScreen(padding: PaddingValues, vm: BookingViewModel) {
    val draft = vm.draft
    val canGoBack = draft.step !in setOf(BookingStep.SERVICE, BookingStep.CONFIRMATION)
    Scaffold(
        topBar = {
            if (canGoBack) TopAppBar(
                title = { Text(stepTitle(draft.step)) },
                navigationIcon = { IconButton(onClick = vm::back) { Icon(Icons.Default.ArrowBack, "Back") } },
            )
        },
        modifier = Modifier.padding(padding),
    ) { inner ->
        when (draft.step) {
            BookingStep.SERVICE -> ServiceStep(draft, vm, inner)
            BookingStep.ADDRESS -> AddressStep(draft, vm, inner)
            BookingStep.AVAILABILITY -> AvailabilityStep(draft, vm, inner)
            BookingStep.INSPIRATION -> InspirationStep(draft, vm, inner)
            BookingStep.SUMMARY -> SummaryStep(draft, vm, inner)
            BookingStep.CHECKOUT -> CheckoutStep(draft, vm, inner)
            BookingStep.CONFIRMATION -> ConfirmationStep(draft, vm, inner)
        }
    }
}

@Composable
private fun ServiceStep(draft: BookingDraft, vm: BookingViewModel, padding: PaddingValues) = BookingList(padding) {
    item { Text("Book Glossed Tip", style = MaterialTheme.typography.headlineMedium) }
    draft.portfolioSet?.let { set -> item { AssistChip(onClick = {}, label = { Text("From set: ${set.title}") }) } }
    item { Text("Guest browsing is public. Google or phone verification will be required when real booking persistence is enabled.") }
    item { ProgressLabel(1, "Service") }
    items(SampleData.services) { service ->
        ElevatedCard(onClick = { vm.selectService(service) }) {
            Column(Modifier.fillMaxWidth().padding(16.dp)) {
                Text(service.name, style = MaterialTheme.typography.titleMedium)
                Text(service.description)
                Text("${money(service.priceCents)}+ • ${service.durationMinutes} min base")
                if (draft.service?.id == service.id) Text("Selected ✓", color = MaterialTheme.colorScheme.primary)
            }
        }
    }
    if (draft.service != null) {
        item {
            EnumChips("Length", NailLength.entries, draft.customization.length, { it.label }) {
                vm.updateCustomization(draft.customization.copy(length = it))
            }
        }
        item {
            EnumChips("Shape", NailShape.entries, draft.customization.shape, { it.label }) {
                vm.updateCustomization(draft.customization.copy(shape = it))
            }
        }
        item {
            EnumChips("Art", ArtLevel.entries, draft.customization.artLevel, { it.label }) {
                vm.updateCustomization(draft.customization.copy(artLevel = it))
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Existing product removal")
                Switch(draft.customization.removalRequired, { vm.updateCustomization(draft.customization.copy(removalRequired = it)) })
            }
        }
        item {
            Text("Repairs: ${draft.customization.repairCount}")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { vm.updateCustomization(draft.customization.copy(repairCount = (draft.customization.repairCount - 1).coerceAtLeast(0))) }) { Text("−") }
                OutlinedButton(onClick = { vm.updateCustomization(draft.customization.copy(repairCount = (draft.customization.repairCount + 1).coerceAtMost(5))) }) { Text("+") }
            }
        }
        item { PriceCard(draft.pricing) }
        item { Button(vm::goToAddress, Modifier.fillMaxWidth()) { Text("Continue to Booking") } }
    }
}

@Composable
private fun AddressStep(draft: BookingDraft, vm: BookingViewModel, padding: PaddingValues) = BookingList(padding) {
    item { ProgressLabel(2, "Service address") }
    item { Text("Where should Maya travel?", style = MaterialTheme.typography.headlineSmall) }
    item { Text("Saved Home / Work / Other addresses and Google Places autocomplete are wired as the production integration target. This demo accepts a manual Pinellas County address.") }
    item { AddressField("Street", draft.serviceAddress.street) { vm.updateAddress(draft.serviceAddress.copy(street = it)) } }
    item { AddressField("City", draft.serviceAddress.city) { vm.updateAddress(draft.serviceAddress.copy(city = it)) } }
    item { AddressField("ZIP", draft.serviceAddress.zipCode) { vm.updateAddress(draft.serviceAddress.copy(zipCode = it)) } }
    item { OutlinedButton(vm::validateAddress, Modifier.fillMaxWidth()) { Text("Check Service Area") } }
    draft.addressValidation?.let { validation ->
        item {
            Card {
                Column(Modifier.padding(16.dp)) {
                    Text(validation.message)
                    if (validation.isInServiceArea) {
                        Text("Zone: ${validation.zone?.label}")
                        Text("Base travel estimate: ${validation.estimatedTravelMinutes} min")
                        Text("Travel fee: ${money(validation.travelFeeCents)}")
                    }
                }
            }
        }
        if (validation.isInServiceArea) item {
            Button(vm::findAvailability, Modifier.fillMaxWidth()) { Text("Find Travel-Aware Times") }
        }
    }
}

@Composable
private fun AvailabilityStep(draft: BookingDraft, vm: BookingViewModel, padding: PaddingValues) = BookingList(padding) {
    item { ProgressLabel(3, "Availability") }
    item { Text("Travel-aware times", style = MaterialTheme.typography.headlineSmall) }
    item { Text("Each slot checks previous client → your appointment → next client, including setup/cleanup and travel.") }
    items(vm.availability) { slot ->
        FilterChip(
            selected = draft.selectedSlot?.id == slot.id,
            onClick = { vm.selectSlot(slot) },
            label = { Text("${slot.dayLabel}, ${slot.dateLabel} • ${slot.timeLabel} • in ${slot.inboundTravelMinutes}m / out ${slot.outboundTravelMinutes}m") },
        )
    }
    if (draft.selectedSlot != null) item { Button(vm::goToInspiration, Modifier.fillMaxWidth()) { Text("Continue") } }
}

@Composable
private fun InspirationStep(draft: BookingDraft, vm: BookingViewModel, padding: PaddingValues) {
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { vm.setInspiration(it?.toString()) }
    BookingList(padding) {
        item { ProgressLabel(4, "Inspiration") }
        item { Text("Add inspiration", style = MaterialTheme.typography.headlineSmall) }
        item { OutlinedButton({ picker.launch("image/*") }, Modifier.fillMaxWidth()) { Text(if (draft.inspirationUri == null) "Choose Image" else "Replace Image") } }
        if (draft.inspirationUri != null) item { Text("Image attached ✓") }
        item {
            OutlinedTextField(
                value = draft.clientNote,
                onValueChange = vm::setClientNote,
                label = { Text("Notes for Maya") },
                minLines = 3,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        item { Button(vm::goToSummary, Modifier.fillMaxWidth()) { Text("Review Booking") } }
    }
}

@Composable
private fun SummaryStep(draft: BookingDraft, vm: BookingViewModel, padding: PaddingValues) = BookingList(padding) {
    item { ProgressLabel(5, "Review") }
    item { Text("Review your booking", style = MaterialTheme.typography.headlineSmall) }
    item { SummaryCard(draft) }
    item { Text("Free cancellation/rescheduling until 24 hours before the appointment. Inside 24 hours, the 25% deposit is forfeited unless the technician grants an exception.") }
    item { Button(vm::goToCheckout, Modifier.fillMaxWidth()) { Text("Hold Slot & Pay ${money(draft.pricing.depositCents)}") } }
}

@Composable
private fun CheckoutStep(draft: BookingDraft, vm: BookingViewModel, padding: PaddingValues) = BookingList(padding) {
    item { ProgressLabel(6, "Deposit") }
    item { Text("Deposit checkout", style = MaterialTheme.typography.headlineSmall) }
    item { PriceCard(draft.pricing) }
    item { Text("This demo creates a 10-minute PENDING_PAYMENT hold. Production will create the hold in Firestore/Cloud Functions, open Stripe PaymentSheet, then confirm only after Stripe succeeds.") }
    item { Button(vm::confirmDemoPayment, Modifier.fillMaxWidth()) { Text("Complete Test Payment") } }
}

@Composable
private fun ConfirmationStep(draft: BookingDraft, vm: BookingViewModel, padding: PaddingValues) = BookingList(padding) {
    item { Text("You're booked ✨", style = MaterialTheme.typography.headlineMedium) }
    item { Text("Status: ${draft.status}") }
    item { SummaryCard(draft) }
    item { Button(vm::startOver, Modifier.fillMaxWidth()) { Text("Book Another Appointment") } }
}

@Composable
private fun SummaryCard(draft: BookingDraft) {
    Card {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(draft.service?.name ?: "Service", style = MaterialTheme.typography.titleLarge)
            draft.portfolioSet?.let { Text("Inspired by: ${it.title}") }
            Text("${draft.customization.length.label} • ${draft.customization.shape.label} • ${draft.customization.artLevel.label} art")
            Text("${draft.serviceAddress.street}, ${draft.serviceAddress.city}, FL ${draft.serviceAddress.zipCode}")
            draft.selectedSlot?.let { Text("${it.dayLabel}, ${it.dateLabel} at ${it.timeLabel}") }
            if (draft.inspirationUri != null) Text("Inspiration attached ✓")
            HorizontalDivider()
            Text("Service: ${money(draft.pricing.serviceSubtotalCents)}")
            Text("Travel: ${money(draft.pricing.travelFeeCents)}")
            Text("Total: ${money(draft.pricing.totalCents)}")
            Text("25% deposit: ${money(draft.pricing.depositCents)}")
            Text("Remaining: ${money(draft.pricing.remainingBalanceCents)}")
        }
    }
}

@Composable private fun PriceCard(pricing: BookingPricing) = Card { Column(Modifier.fillMaxWidth().padding(16.dp)) { Text("Estimated total: ${money(pricing.totalCents)}", style = MaterialTheme.typography.titleMedium); Text("25% deposit: ${money(pricing.depositCents)}") } }
@Composable private fun AddressField(label: String, value: String, onValue: (String) -> Unit) = OutlinedTextField(value, onValue, Modifier.fillMaxWidth(), label = { Text(label) })
@Composable private fun ProgressLabel(number: Int, label: String) = Text("Step $number of 6 • $label", color = MaterialTheme.colorScheme.secondary)

@Composable
private fun <T> EnumChips(label: String, options: List<T>, selected: T, name: (T) -> String, onSelect: (T) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = MaterialTheme.typography.titleMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            options.forEach { option -> FilterChip(selected == option, { onSelect(option) }, { Text(name(option)) }) }
        }
    }
}

@Composable
private fun BookingList(padding: PaddingValues, content: androidx.compose.foundation.lazy.LazyListScope.() -> Unit) = LazyColumn(
    modifier = Modifier.padding(padding).fillMaxSize(),
    contentPadding = PaddingValues(20.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp),
    content = content,
)

private fun money(cents: Int): String = NumberFormat.getCurrencyInstance(Locale.US).format(cents / 100.0)
private fun stepTitle(step: BookingStep) = when (step) {
    BookingStep.SERVICE -> "Service"
    BookingStep.ADDRESS -> "Address"
    BookingStep.AVAILABILITY -> "Availability"
    BookingStep.INSPIRATION -> "Inspiration"
    BookingStep.SUMMARY -> "Review"
    BookingStep.CHECKOUT -> "Deposit"
    BookingStep.CONFIRMATION -> "Confirmed"
}
