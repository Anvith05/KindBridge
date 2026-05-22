"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Search, MapPin, Loader2 } from "lucide-react";

export type IndiaLocationValue = {
    state: string;
    city: string;
    locality: string;
    label: string;
};

type Props = {
    onChange: (value: IndiaLocationValue) => void;
    initialState?: string;
    initialCity?: string;
    initialLocality?: string;
};

type SearchHit = { city: string; state: string; label: string };

export default function IndiaLocationPicker({
    onChange,
    initialState = "",
    initialCity = "",
    initialLocality = "",
}: Props) {
    const [states, setStates] = useState<string[]>([]);
    const [cities, setCities] = useState<{ city: string; state: string }[]>([]);
    const [selectedState, setSelectedState] = useState(initialState);
    const [selectedCity, setSelectedCity] = useState(initialCity);
    const [locality, setLocality] = useState(initialLocality);

    useEffect(() => {
        setSelectedState(initialState);
        setSelectedCity(initialCity);
        setLocality(initialLocality);
        if (initialCity && initialState) {
            setSearchQuery(`${initialCity}, ${initialState}`);
        }
    }, [initialState, initialCity, initialLocality]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        api.get("/api/locations/states")
            .then((res) => setStates(res.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!selectedState) {
            setCities([]);
            return;
        }
        api.get("/api/locations/cities", { params: { state: selectedState } })
            .then((res) => setCities(res.data))
            .catch(() => setCities([]));
    }, [selectedState]);

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        const label = [locality, selectedCity, selectedState].filter(Boolean).join(", ");
        onChangeRef.current({
            state: selectedState,
            city: selectedCity,
            locality,
            label: label ? `${label}, India` : "",
        });
    }, [selectedState, selectedCity, locality]);

    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const { data } = await api.get("/api/locations/search", { params: { q: searchQuery } });
                setSearchResults(data);
                setShowResults(true);
            } catch {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const pickSearchResult = (hit: SearchHit) => {
        setSelectedState(hit.state);
        setSelectedCity(hit.city);
        setSearchQuery(hit.label);
        setShowResults(false);
    };

    return (
        <div className="space-y-4">
            <div ref={searchRef} className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <Search className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                    Search city (all India)
                </label>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    className="input-premium"
                    placeholder="Type city name e.g. Guntur, Mumbai..."
                    autoComplete="off"
                />
                {searching && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-10" />
                )}
                {showResults && searchResults.length > 0 && (
                    <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((hit, i) => (
                            <li key={`${hit.city}-${hit.state}-${i}`}>
                                <button
                                    type="button"
                                    onClick={() => pickSearchResult(hit)}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors"
                                >
                                    <span className="font-medium text-gray-900">{hit.city}</span>
                                    <span className="text-gray-400"> — {hit.state}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
                    <select
                        required
                        value={selectedState}
                        onChange={(e) => {
                            setSelectedState(e.target.value);
                            setSelectedCity("");
                        }}
                        className="input-premium"
                    >
                        <option value="">Select state</option>
                        {states.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                    <select
                        required
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="input-premium"
                        disabled={!selectedState}
                    >
                        <option value="">{selectedState ? "Select city" : "Select state first"}</option>
                        {cities.map((c) => (
                            <option key={c.city} value={c.city}>{c.city}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                    Area / landmark (optional)
                </label>
                <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="input-premium"
                    placeholder="e.g. SRM University, Mangalagiri"
                />
            </div>
        </div>
    );
}
