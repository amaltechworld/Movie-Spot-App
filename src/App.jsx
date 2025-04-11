import "./App.css";
import { useState, useEffect } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: "GET",
    headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_KEY}`,
    },
};

const App = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [debounceSearchTerm, setDebounceSearchTerm] = useState("");
    const [trendingMovies, setTrendingMovies] = useState([]);

    //useDebounce hook: to prevent making too many api request by waiting 500ms
    useDebounce(() => setDebounceSearchTerm(searchTerm), 500, [searchTerm]);

    const fetchMovies = async (query = "") => {
        setIsLoading(true);
        setErrorMessage("");
        //  'https://api.themoviedb.org/3/search/movie?include_adult=false&language=en-US&page=1'
        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
                      query
                  )}`
                : `${API_BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);

            if (!response.ok) {
                throw new Error("Failed to fetch movies");
            }

            const data = await response.json();
            // console.log(data);

            if (data.response === "false") {
                setErrorMessage(data.Error || "Failed to fetch movies");
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);
            // import from appwrite.js
            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }
        } catch (error) {
            console.error(`Error fetching Movies: ${error}`);
            setErrorMessage("Error fetching movies. Please try again later");
        } finally {
            setIsLoading(false);
        }
    };

    const loadTrendingMovies = async () => {
        try {
            const response = await getTrendingMovies();

            const movies = response || [];
            // Make sure we have valid data
            if (Array.isArray(movies) && movies.length > 0) {
                setTrendingMovies(movies);
            } else {
                console.log("No trending movies found or invalid data format");
            }
        } catch (error) {
            console.error(`Error fetching trending movies: ${error}`);
        }
    };

    useEffect(() => {
        fetchMovies(debounceSearchTerm);
    }, [debounceSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (
        <main>
            <div className="pattern" />
            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero Banner" />
                    <h1>
                        Find <span className="text-gradient"> Movies </span>{" "}
                        You'll Enjoy Without the Hassle
                    </h1>
                    <Search
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                </header>
                {Array.isArray(trendingMovies) && trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id || index}>
                                    <p>{index + 1}</p>
                                    {console.log("Movie data:", movie)} 
                                    <img
                                        src={movie.poster_url}
                                        alt={movie.title}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="all-movies">
                    <h2>All Movies</h2>

                    {isLoading ? (
                        <Spinner />
                    ) : errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                //
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
};

export default App;
