export enum TripStatus {
    DRAFT = 'DRAFT',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    APPROVED = 'APPROVED',
    CANCELLED = 'CANCELLED',
    IN_PROCESS = 'IN_PROCESS',
    REFUNDED = 'REFUNDED'
}

export interface Trip {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: TripStatus;
    userId: string;
    approverNote?: string;
    //   expenses: Expense[];
}

export enum ExpenseType {
    CAR_RENTAL = 'CAR_RENTAL',
    HOTEL = 'HOTEL',
    FLIGHT = 'FLIGHT',
    TAXI = 'TAXI'
}

export interface BaseExpense {
    id: string;
    type: ExpenseType;
    totalPrice: number;
    tripId: string;
}

export interface CarRentalExpense extends BaseExpense {
    type: ExpenseType.CAR_RENTAL;
    carName: string;
    pickupDateTime: Date;
    dropoffDateTime: Date;
    pickupLocation: string;
    dropoffLocation: string;
}

export interface HotelExpense extends BaseExpense {
    type: ExpenseType.HOTEL;
    hotelName: string;
    location: string;
    checkInDate: Date;
    checkOutDate: Date;
}

export interface FlightExpense extends BaseExpense {
    type: ExpenseType.FLIGHT;
    airline: string;
    from: string;
    to: string;
    departureDateTime: Date;
    arrivalDateTime: Date;
}

export interface TaxiExpense extends BaseExpense {
    type: ExpenseType.TAXI;
    from: string;
    to: string;
    dateTime: Date;
}

export type Expense = CarRentalExpense | HotelExpense | FlightExpense | TaxiExpense;