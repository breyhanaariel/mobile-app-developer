package com.breyhanaariel.glossedtip.domain.model

data class NailService(val id: String, val name: String, val description: String, val priceCents: Int, val durationMinutes: Int)
data class PortfolioSet(val id: String, val title: String, val serviceId: String, val shape: String, val length: String, val artLevel: ArtLevel, val estimatedPriceCents: Int, val tags: List<String>)

enum class ArtLevel(val label: String, val addOnCents: Int, val extraMinutes: Int) {
    SIMPLE("Simple", 1000, 20), DETAILED("Detailed", 2500, 45), FREESTYLE("Freestyle", 4000, 60)
}
enum class NailLength(val label: String, val addOnCents: Int, val extraMinutes: Int) {
    SHORT("Short", 0, 0), MEDIUM("Medium", 500, 10), LONG("Long", 1000, 20), XL("XL", 1500, 30)
}
enum class NailShape(val label: String) { SQUARE("Square"), ROUND("Round"), ALMOND("Almond"), COFFIN("Coffin"), STILETTO("Stiletto") }

data class ServiceCustomization(
    val length: NailLength = NailLength.SHORT,
    val shape: NailShape = NailShape.SQUARE,
    val artLevel: ArtLevel = ArtLevel.SIMPLE,
    val removalRequired: Boolean = false,
    val repairCount: Int = 0,
)

data class GeoPoint(val latitude: Double, val longitude: Double)

data class ServiceAddress(
    val id: String? = null,
    val label: String = "Home",
    val street: String = "",
    val city: String = "",
    val state: String = "FL",
    val zipCode: String = "",
    val formattedAddress: String? = null,
    val placeId: String? = null,
    val coordinates: GeoPoint? = null,
)

enum class TravelZone(val label: String) { CORE("Core Pinellas"), NEARBY("Nearby Pinellas"), EXTENDED("Extended Pinellas") }

data class AddressValidationResult(
    val isValid: Boolean,
    val isInServiceArea: Boolean,
    val zone: TravelZone? = null,
    val estimatedTravelMinutes: Int = 0,
    val travelFeeCents: Int = 0,
    val message: String = "",
)

data class AvailabilitySlot(
    val id: String,
    val dayLabel: String,
    val dateLabel: String,
    val timeLabel: String,
    val startMinutesFromMidnight: Int,
    val endMinutesFromMidnight: Int,
    val inboundTravelMinutes: Int,
    val outboundTravelMinutes: Int,
)

data class BookingPricing(
    val serviceSubtotalCents: Int = 0,
    val travelFeeCents: Int = 0,
    val totalCents: Int = 0,
    val depositCents: Int = 0,
    val remainingBalanceCents: Int = 0,
)

enum class BookingStatus { DRAFT, PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW }
data class AppointmentHold(val holdId: String, val slotId: String, val expiresAtEpochMillis: Long)
enum class BookingStep { SERVICE, ADDRESS, AVAILABILITY, INSPIRATION, SUMMARY, CHECKOUT, CONFIRMATION }

data class BookingDraft(
    val service: NailService? = null,
    val portfolioSet: PortfolioSet? = null,
    val customization: ServiceCustomization = ServiceCustomization(),
    val serviceAddress: ServiceAddress = ServiceAddress(),
    val addressValidation: AddressValidationResult? = null,
    val selectedSlot: AvailabilitySlot? = null,
    val inspirationUri: String? = null,
    val uploadedInspirationUrl: String? = null,
    val clientNote: String = "",
    val pricing: BookingPricing = BookingPricing(),
    val status: BookingStatus = BookingStatus.DRAFT,
    val hold: AppointmentHold? = null,
    val step: BookingStep = BookingStep.SERVICE,
)
