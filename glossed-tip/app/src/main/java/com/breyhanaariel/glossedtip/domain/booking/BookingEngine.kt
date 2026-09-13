package com.breyhanaariel.glossedtip.domain.booking

import com.breyhanaariel.glossedtip.domain.model.*
import kotlin.math.ceil

object BookingEngine {
    private const val REMOVAL_PRICE_CENTS = 1500
    private const val REMOVAL_MINUTES = 30
    private const val REPAIR_PRICE_CENTS = 500
    private const val REPAIR_MINUTES = 10
    private const val SETUP_CLEANUP_BUFFER_MINUTES = 30
    private const val WORKDAY_START = 9 * 60
    private const val WORKDAY_END = 19 * 60

    private data class ZoneRule(val zone: TravelZone, val travelFeeCents: Int, val baseTravelMinutes: Int)
    private data class ExistingAppointment(val dayIndex: Int, val startMinutes: Int, val endMinutes: Int, val zone: TravelZone)

    private val zipRules: Map<String, ZoneRule> = buildMap {
        listOf("33770", "33771", "33772", "33773", "33774", "33776", "33777", "33778").forEach { put(it, ZoneRule(TravelZone.CORE, 0, 12)) }
        listOf("33755", "33756", "33759", "33760", "33761", "33762", "33763", "33764", "33765", "33767", "33781", "33782", "33786", "34695", "34698").forEach { put(it, ZoneRule(TravelZone.NEARBY, 1000, 22)) }
        listOf("33701", "33702", "33703", "33704", "33705", "33706", "33707", "33708", "33709", "33710", "33711", "33712", "33713", "33714", "33715", "33716", "34683", "34684", "34689").forEach { put(it, ZoneRule(TravelZone.EXTENDED, 2000, 35)) }
    }

    private val seededAppointments = listOf(
        ExistingAppointment(0, 10 * 60, 12 * 60, TravelZone.CORE),
        ExistingAppointment(0, 15 * 60, 17 * 60, TravelZone.NEARBY),
        ExistingAppointment(1, 12 * 60, 14 * 60, TravelZone.EXTENDED),
        ExistingAppointment(2, 9 * 60 + 30, 11 * 60 + 30, TravelZone.CORE),
        ExistingAppointment(3, 14 * 60, 16 * 60, TravelZone.NEARBY),
    )

    fun calculateServicePriceCents(service: NailService, customization: ServiceCustomization): Int =
        service.priceCents + customization.length.addOnCents + customization.artLevel.addOnCents +
            (if (customization.removalRequired) REMOVAL_PRICE_CENTS else 0) +
            (customization.repairCount.coerceIn(0, 5) * REPAIR_PRICE_CENTS)

    fun calculateServiceDurationMinutes(service: NailService, customization: ServiceCustomization): Int =
        service.durationMinutes + customization.length.extraMinutes + customization.artLevel.extraMinutes +
            (if (customization.removalRequired) REMOVAL_MINUTES else 0) +
            (customization.repairCount.coerceIn(0, 5) * REPAIR_MINUTES) + SETUP_CLEANUP_BUFFER_MINUTES

    fun validateAddress(address: ServiceAddress): AddressValidationResult {
        val zip = address.zipCode.trim()
        if (address.street.isBlank() || address.city.isBlank() || zip.length != 5 || zip.any { !it.isDigit() }) {
            return AddressValidationResult(false, false, message = "Enter a complete street, city, and 5-digit ZIP code.")
        }
        val rule = zipRules[zip] ?: return AddressValidationResult(true, false, message = "This address is outside Glossed Tip's fictional Pinellas County service area.")
        return AddressValidationResult(
            isValid = true,
            isInServiceArea = true,
            zone = rule.zone,
            estimatedTravelMinutes = rule.baseTravelMinutes,
            travelFeeCents = rule.travelFeeCents,
            message = when (rule.zone) {
                TravelZone.CORE -> "You're in the Core Pinellas zone — travel is included."
                TravelZone.NEARBY -> "You're in the Nearby Pinellas zone — a $10 travel fee applies."
                TravelZone.EXTENDED -> "You're in the Extended Pinellas zone — a $20 travel fee applies."
            },
        )
    }

    fun calculatePricing(service: NailService, customization: ServiceCustomization, address: AddressValidationResult?): BookingPricing {
        val serviceSubtotal = calculateServicePriceCents(service, customization)
        val travel = address?.travelFeeCents ?: 0
        val total = serviceSubtotal + travel
        val deposit = ceil(total * 0.25).toInt()
        return BookingPricing(serviceSubtotal, travel, total, deposit, total - deposit)
    }

    fun generateAvailability(service: NailService, customization: ServiceCustomization, address: AddressValidationResult): List<AvailabilitySlot> {
        val destinationZone = address.zone ?: return emptyList()
        if (!address.isInServiceArea) return emptyList()
        val serviceBlock = calculateServiceDurationMinutes(service, customization)
        val days = listOf(Triple("Tue", "Sep 15", 0), Triple("Wed", "Sep 16", 1), Triple("Fri", "Sep 18", 2), Triple("Sat", "Sep 19", 3))
        return days.flatMap { (day, date, dayIndex) ->
            val appointments = seededAppointments.filter { it.dayIndex == dayIndex }.sortedBy { it.startMinutes }
            (WORKDAY_START..WORKDAY_END step 30).mapNotNull { start ->
                val end = start + serviceBlock
                if (end > WORKDAY_END) return@mapNotNull null
                if (appointments.any { start < it.endMinutes && end > it.startMinutes }) return@mapNotNull null
                val previous = appointments.lastOrNull { it.endMinutes <= start }
                val next = appointments.firstOrNull { it.startMinutes >= end }
                val inbound = previous?.let { estimateInterZoneTravelMinutes(it.zone, destinationZone) } ?: address.estimatedTravelMinutes
                val outbound = next?.let { estimateInterZoneTravelMinutes(destinationZone, it.zone) } ?: address.estimatedTravelMinutes
                if (previous != null && previous.endMinutes + inbound > start) return@mapNotNull null
                if (next != null && end + outbound > next.startMinutes) return@mapNotNull null
                AvailabilitySlot("$dayIndex-$start", day, date, minutesToLabel(start), start, end, inbound, outbound)
            }
        }.take(16)
    }

    private fun estimateInterZoneTravelMinutes(from: TravelZone, to: TravelZone): Int {
        if (from == to) return when (from) { TravelZone.CORE -> 12; TravelZone.NEARBY -> 15; TravelZone.EXTENDED -> 20 }
        return if (kotlin.math.abs(from.ordinal - to.ordinal) == 1) 25 else 40
    }

    private fun minutesToLabel(minutes: Int): String {
        val hour24 = minutes / 60
        val minute = minutes % 60
        val suffix = if (hour24 >= 12) "PM" else "AM"
        val hour12 = (hour24 % 12).let { if (it == 0) 12 else it }
        return "%d:%02d %s".format(hour12, minute, suffix)
    }
}
