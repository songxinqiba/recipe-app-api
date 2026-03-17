import { View, Text, Alert, ScrollView, TouchableOpacity, FlatList } from 'react-native'
import { API_URL } from '../../constants/api'
import { useClerk, useUser } from "../../auth/clerk";
import { useEffect, useState } from 'react'
import { favoritesStyles } from "../../assets/styles/favorites.styles"
import { COLORS } from '../../constants/colors'
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from 'expo-router'
import RecipeCard from '../../components/RecipeCard'
import NoFavoritesFound from '../../components/NoFavoritesFound'
import LoadingSpinner from '../../components/LoadingSpinner'


const FavoritesScreen = () => {
    const router = useRouter();
    const { signOut } = useClerk();
    const { user } = useUser();
    const [favoriteRecipes, setFavoriteRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const loadFavorites = async () => {
            setLoading(true);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                try {
                    const response = await fetch(`${API_URL}/favorites/${user.id}`, {
                        signal: controller.signal,
                    });

                    if (!response.ok) throw new Error("Failed to fetch favorites");
                    const favorites = await response.json();
                    const transformedFavorites = favorites.map(favorite => ({
                        ...favorite,
                        id: favorite.recipeId
                    }));
                    setFavoriteRecipes(transformedFavorites);
                } finally {
                    clearTimeout(timeoutId);
                }
            } catch (error) {
                console.log("Error loading favorites", error);
                const message =
                    error?.name === "AbortError"
                        ? "Request timed out. Check your API URL / server."
                        : "Failed to load favorites";
                Alert.alert("Error", message);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, [user?.id]);

    const handleSignOut = async () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await signOut();
                    router.replace("/sign-in");
                },
            },
        ])

    }

    if (loading) return <LoadingSpinner message='Loading your favorites...' />


    return (
        <View style={favoritesStyles.container}>
            <ScrollView showsHorizontalScrollIndicator={false}>
                <View style={favoritesStyles.header}>
                    <Text style={favoritesStyles.title}>Favorites</Text>
                    <TouchableOpacity style={favoritesStyles.logoutButton} onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
                <View style={favoritesStyles.recipesSection}>
                    <FlatList
                        data={favoriteRecipes}
                        renderItem={({ item }) => <RecipeCard recipe={item} />}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        columnWrapperStyle={favoritesStyles.row}
                        contentContainerStyle={favoritesStyles.recipesGrid}
                        scrollEnabled={false}
                        ListEmptyComponent={<NoFavoritesFound />}

                    />


                </View>
            </ScrollView>
        </View>
    );
}
export default FavoritesScreen;
