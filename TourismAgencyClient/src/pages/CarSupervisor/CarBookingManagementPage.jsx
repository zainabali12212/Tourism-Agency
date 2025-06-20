import React, { useState, useEffect, useMemo, useCallback } from 'react';
import carBookingService from '../../services/CarSupervisor/carBookingService';
import carService from '../../services/CarSupervisor/carService';
import DashboardHeader from '../../components/shared/DashboardHeader';
import DataTable from '../../components/shared/DataTable';
import ErrorMessage from '../../components/shared/ErrorMessage';
import '../shared/ManagementPage.css';

const CarBookingManagementPage = () => {
    const [bookings, setBookings] = useState([]);
    const [cars, setCars] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: '0', // Default to 'Pending'
        carId: '',
        startDate: '',
        endDate: '',
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [bookingsData, carsData] = await Promise.all([
                carBookingService.getCarBookings(),
                carService.getCars(),
            ]);
            setBookings(bookingsData);
            setCars(carsData);
        } catch (err) {
            setError("Failed to load data. Please try again later.");
            console.error("Failed to load data:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleAction = async (action, id) => {
        setError(null);
        try {
            if (action === 'accept') {
                await carBookingService.acceptCarBooking(id);
            } else if (action === 'reject') {
                await carBookingService.rejectCarBooking(id);
            }
            loadData(); // Refresh data after action
        } catch (err) {
            setError(`Failed to ${action} booking. Please try again.`);
            console.error(`Failed to ${action} booking:`, err);
        }
    };

    const carMap = useMemo(() => new Map(cars.map(c => [c.id, c.model])), [cars]);
    const getStatusText = (status) => {
        switch (status) {
            case 0: return 'Pending';
            case 1: return 'Rejected';
            case 2: return 'Confirmed';
            default: return 'Unknown';
        }
    };

    const filteredBookings = useMemo(() => {
        
        return bookings
            .filter(booking => {
                if (filters.status && booking.status.toString() !== filters.status) return false;
                if (filters.carId && booking.carId.toString() !== filters.carId) return false;
                if (filters.startDate && new Date(booking.startDate) < new Date(filters.startDate)) return false;
                if (filters.endDate && new Date(booking.endDate) > new Date(filters.endDate)) return false;
                return true;
            })
            .map(booking => ({
                ...booking,
                carModel: carMap.get(booking.carId) || 'N/A',
                statusText: getStatusText(booking.status),
                startDate: new Date(booking.startDate).toLocaleDateString(),
                endDate: new Date(booking.endDate).toLocaleDateString(),
            }));
    }, [bookings, filters, carMap]);

    const columns = [
        { header: 'ID', key: 'id' },
        { header: 'Customer ID', key: 'customerId' },
        { header: 'Car', key: 'CarModel' },
        { header: 'Start Date', key: 'startDate' },
        { header: 'End Date', key: 'endDate' },
        { header: 'Status', key: 'statusText' },
        { header: 'Passengers', key: 'numOfPassengers' },
        { header: 'With Driver', key: 'withDriver' },
    ];
    console.log(bookings);
    
    return (
        <div className="management-page">
            <DashboardHeader title="Manage Car Bookings" subtitle="Review, accept, or reject car bookings" />
            <main className="management-content">
                <div className="toolbar">
                    <div className="filters">
                        <div className="filter-group">
                            <label htmlFor="status-filter">Status:</label>
                            <select id="status-filter" name="status" value={filters.status} onChange={handleFilterChange}>
                                <option value="">All</option>
                                <option value="0">Pending</option>
                                <option value="2">Confirmed</option>
                                <option value="1">Rejected</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="car-filter">Car:</label>
                            <select id="car-filter" name="CarId" value={filters.carId} onChange={handleFilterChange}>
                                <option value="">All</option>
                                {cars.map(car => (
                                    <option key={car.id} value={car.id}>{car.model}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="start-date-filter">Start Date:</label>
                            <input type="date" id="start-date-filter" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="form-input" />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="end-date-filter">End Date:</label>
                            <input type="date" id="end-date-filter" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="form-input" />
                        </div>
                    </div>
                </div>

                <ErrorMessage message={error} onClear={() => setError(null)} />

                {isLoading ? (
                    <p>Loading bookings...</p>
                ) : (
                    <DataTable
                        title="Car Bookings"
                        columns={columns}
                        data={filteredBookings}
                        onAccept={(x) => {handleAction('accept', x)}}
                        onCancel={(x) => {handleAction('reject', x)}}
                        
                    />
                )}
            </main>
        </div>
    );
};

export default CarBookingManagementPage;