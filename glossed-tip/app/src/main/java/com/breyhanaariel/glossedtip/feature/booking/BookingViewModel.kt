package com.breyhanaariel.glossedtip.feature.booking

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import com.breyhanaariel.glossedtip.domain.booking.BookingEngine
import com.breyhanaariel.glossedtip.domain.model.*

class BookingViewModel : ViewModel() {
    var draft by mutableStateOf(BookingDraft())
        private set

    var availability by mutableStateOf<List<AvailabilitySlot>>(emptyList())
        private set

    fun selectService(service: NailService) {
        val customization = draft.customization
        draft = draft.copy(service = service, pricing = BookingEngine.calculatePricing(service, customization, draft.addressValidation))
    }

    fun updateCustomization(customization: ServiceCustomization) {
        val service = draft.service
        draft = draft.copy(customization = customization, pricing = service?.let { BookingEngine.calculatePricing(it, customization, draft.addressValidation) } ?: BookingPricing())
    }

    fun goToAddress() { draft = draft.copy(step = BookingStep.ADDRESS) }
    fun updateAddress(address: ServiceAddress) { draft = draft.copy(serviceAddress = address, addressValidation = null, selectedSlot = null) }

    fun validateAddress() {
        val validation = BookingEngine.validateAddress(draft.serviceAddress)
        val service = draft.service
        val pricing = if (service != null) BookingEngine.calculatePricing(service, draft.customization, validation) else BookingPricing()
        draft = draft.copy(addressValidation = validation, pricing = pricing)
    }

    fun findAvailability() {
        val service = draft.service ?: return
        val validation = draft.addressValidation ?: return
        if (!validation.isInServiceArea) return
        availability = BookingEngine.generateAvailability(service, draft.customization, validation)
        draft = draft.copy(step = BookingStep.AVAILABILITY)
    }

    fun selectSlot(slot: AvailabilitySlot) { draft = draft.copy(selectedSlot = slot) }
    fun goToInspiration() { draft = draft.copy(step = BookingStep.INSPIRATION) }
    fun setInspiration(uri: String?) { draft = draft.copy(inspirationUri = uri) }
    fun setClientNote(note: String) { draft = draft.copy(clientNote = note) }
    fun goToSummary() { draft = draft.copy(step = BookingStep.SUMMARY) }

    fun goToCheckout() {
        val slot = draft.selectedSlot ?: return
        val hold = AppointmentHold("demo-${slot.id}", slot.id, System.currentTimeMillis() + (10 * 60 * 1000))
        draft = draft.copy(step = BookingStep.CHECKOUT, status = BookingStatus.PENDING_PAYMENT, hold = hold)
    }

    fun confirmDemoPayment() { draft = draft.copy(step = BookingStep.CONFIRMATION, status = BookingStatus.CONFIRMED) }

    fun back() {
        val previous = when (draft.step) {
            BookingStep.SERVICE -> BookingStep.SERVICE
            BookingStep.ADDRESS -> BookingStep.SERVICE
            BookingStep.AVAILABILITY -> BookingStep.ADDRESS
            BookingStep.INSPIRATION -> BookingStep.AVAILABILITY
            BookingStep.SUMMARY -> BookingStep.INSPIRATION
            BookingStep.CHECKOUT -> BookingStep.SUMMARY
            BookingStep.CONFIRMATION -> BookingStep.CONFIRMATION
        }
        draft = draft.copy(step = previous)
    }

    fun startOver() { draft = BookingDraft(); availability = emptyList() }
}
