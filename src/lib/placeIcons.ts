import { Bank, Bus, Car, Church, Coffee, CreditCard, FirstAid, ForkKnife, GasPump, GraduationCap, Hospital, MapPin, Pill, Shield, SoccerBall, PersonSimpleRun, Storefront, Trash, Wrench, Barbell, Tree, Bed, Briefcase, BeerStein } from '@phosphor-icons/react'
import type { PlaceKind } from '@/lib/places'

/** The icon of a place on the map (owner, 2026-11-20: "an icon from our icons library that fully represents that place"), by what it is (its plain OSM value) and, failing that, by its kind. Phosphor, regular/fill as the family publishes them. */
const BY_LABEL: Record<string, typeof Car> = {
  'bus stop': Bus, pharmacy: Pill, doctors: FirstAid, clinic: FirstAid, dentist: FirstAid, hospital: Hospital, bank: Bank, atm: CreditCard, parking: Car, 'parking space': Car, 'parking entrance': Car,
  fuel: GasPump, 'place of worship': Church, police: Shield, 'fire station': Shield, school: GraduationCap, kindergarten: GraduationCap, college: GraduationCap, university: GraduationCap,
  restaurant: ForkKnife, 'fast food': ForkKnife, cafe: Coffee, bar: BeerStein, pub: BeerStein, 'waste basket': Trash, 'waste disposal': Trash, recycling: Trash, 'car repair': Wrench,
  track: PersonSimpleRun, pitch: SoccerBall, fitness_station: Barbell, 'fitness station': Barbell, park: Tree, garden: Tree, hotel: Bed, hostel: Bed, office: Briefcase,
}
const BY_KIND: Record<PlaceKind, typeof Car> = { shop: Storefront, food: ForkKnife, education: GraduationCap, bus: Bus, other: MapPin }
export const placeIcon = (label: string, kind: PlaceKind) => BY_LABEL[label] ?? BY_KIND[kind]
