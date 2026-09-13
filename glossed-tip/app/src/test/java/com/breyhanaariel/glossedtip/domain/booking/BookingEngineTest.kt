package com.breyhanaariel.glossedtip.domain.booking

import com.breyhanaariel.glossedtip.domain.model.*
import org.junit.Assert.*
import org.junit.Test

class BookingEngineTest {
    private val service = NailService("gelx", "Gel-X", "", 7000, 105)

    @Test
    fun `deposit is twenty five percent rounded up`() {
        val validation = AddressValidationResult(true, true, TravelZone.NEARBY, 22, 1000)
        val pricing = BookingEngine.calculatePricing(service, ServiceCustomization(), validation)
        assertEquals(9000, pricing.totalCents)
        assertEquals(2250, pricing.depositCents)
        assertEquals(6750, pricing.remainingBalanceCents)
    }

    @Test
    fun `customization changes price and duration`() {
        val basic = ServiceCustomization()
        val upgraded = ServiceCustomization(
            length = NailLength.LONG,
            shape = NailShape.ALMOND,
            artLevel = ArtLevel.DETAILED,
            removalRequired = true,
            repairCount = 2,
        )
        assertTrue(BookingEngine.calculateServicePriceCents(service, upgraded) > BookingEngine.calculateServicePriceCents(service, basic))
        assertTrue(BookingEngine.calculateServiceDurationMinutes(service, upgraded) > BookingEngine.calculateServiceDurationMinutes(service, basic))
    }

    @Test
    fun `core Pinellas address is eligible without travel fee`() {
        val result = BookingEngine.validateAddress(ServiceAddress(street = "123 Gulf View Ave", city = "Largo", zipCode = "33770"))
        assertTrue(result.isValid)
        assertTrue(result.isInServiceArea)
        assertEquals(TravelZone.CORE, result.zone)
        assertEquals(0, result.travelFeeCents)
    }

    @Test
    fun `outside service area is rejected`() {
        val result = BookingEngine.validateAddress(ServiceAddress(street = "1 Ocean Dr", city = "Miami Beach", zipCode = "33139"))
        assertTrue(result.isValid)
        assertFalse(result.isInServiceArea)
    }

    @Test
    fun `availability only returns slots that fit workday`() {
        val validation = BookingEngine.validateAddress(ServiceAddress(street = "123 Gulf View Ave", city = "Largo", zipCode = "33770"))
        val slots = BookingEngine.generateAvailability(service, ServiceCustomization(), validation)
        assertTrue(slots.isNotEmpty())
        assertTrue(slots.all { it.startMinutesFromMidnight >= 9 * 60 })
        assertTrue(slots.all { it.endMinutesFromMidnight <= 19 * 60 })
    }
}
