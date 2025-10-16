import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Linking, Animated } from "react-native"
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'
import React, { useState, useEffect, useRef } from "react"

const SongResultDetail = () => {
    const [isPlaying, setIsPlaying] = useState(false)

    // Animation values for visualizer bars
    const bar1 = useRef(new Animated.Value(0.3)).current
    const bar2 = useRef(new Animated.Value(0.5)).current
    const bar3 = useRef(new Animated.Value(0.7)).current
    const bar4 = useRef(new Animated.Value(0.4)).current
    const bar5 = useRef(new Animated.Value(0.6)).current

    useEffect(() => {
        if (isPlaying) {
            startAnimation()
        } else {
            stopAnimation()
        }
    }, [isPlaying])

    const startAnimation = () => {
        const createAnimation = (animValue: Animated.Value, duration: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, {
                        toValue: 1,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(animValue, {
                        toValue: 0.3,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                ])
            )
        }

        Animated.parallel([
            createAnimation(bar1, 400),
            createAnimation(bar2, 600),
            createAnimation(bar3, 500),
            createAnimation(bar4, 700),
            createAnimation(bar5, 550),
        ]).start()
    }

    const stopAnimation = () => {
        bar1.setValue(0.3)
        bar2.setValue(0.5)
        bar3.setValue(0.7)
        bar4.setValue(0.4)
        bar5.setValue(0.6)
    }

    const contohResponse = {
	"status": "success",
	"result": {
		"artist": "Imagine Dragons",
		"title": "Warriors",
		"album": "Warriors",
		"release_date": "2014-09-18",
		"label": "Universal Music",
		"timecode": "02:32",
		"song_link": "https://lis.tn/Warriors",
		"apple_music": {
			"previews": [
				{
					"url": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview118/v4/65/07/f5/6507f5c5-dba8-f2d5-d56b-39dbb62a5f60/mzaf_1124211745011045566.plus.aac.p.m4a"
				}
			],
			"artwork": {
				"width": 1500,
				"height": 1500,
				"url": "https://is2-ssl.mzstatic.com/image/thumb/Music128/v4/f4/78/f5/f478f58e-97cf-83b5-b5da-03d31f14e648/00602547623805.rgb.jpg/{w}x{h}bb.jpeg",
				"bgColor": "7f5516",
				"textColor1": "ffe2aa",
				"textColor2": "f8e0bd",
				"textColor3": "e5c58c",
				"textColor4": "e0c59c"
			},
			"artistName": "Imagine Dragons",
			"url": "https://music.apple.com/us/album/warriors/1440831203?i=1440831624",
			"discNumber": 1,
			"genreNames": [
				"Alternative",
				"Music"
			],
			"durationInMillis": 170799,
			"releaseDate": "2014-09-18",
			"name": "Warriors",
			"isrc": "USUM71414163",
			"albumName": "Smoke + Mirrors (Deluxe)",
			"playParams": {
				"id": "1440831624",
				"kind": "song"
			},
			"trackNumber": 18,
			"composerName": "Imagine Dragons, Alex Da Kid & Josh Mosser"
		},
		"spotify": {
			"album": {
				"album_type": "album",
				"artists": [
					{
						"external_urls": {
							"spotify": "https://open.spotify.com/artist/53XhwfbYqKCa1cC15pYq2q"
						},
						"href": "https://api.spotify.com/v1/artists/53XhwfbYqKCa1cC15pYq2q",
						"id": "53XhwfbYqKCa1cC15pYq2q",
						"name": "Imagine Dragons",
						"type": "artist",
						"uri": "spotify:artist:53XhwfbYqKCa1cC15pYq2q"
					}
				],
				"available_markets": null,
				"external_urls": {
					"spotify": "https://open.spotify.com/album/6ecx4OFG0nlUMqAi9OXQER"
				},
				"href": "https://api.spotify.com/v1/albums/6ecx4OFG0nlUMqAi9OXQER",
				"id": "6ecx4OFG0nlUMqAi9OXQER",
				"images": [
					{
						"height": 640,
						"url": "https://i.scdn.co/image/d3acaeb069f37d8e257221f7224c813c5fa6024e",
						"width": 640
					},
					{
						"height": 300,
						"url": "https://i.scdn.co/image/b039549954758689330893bd4a92585092a81cf5",
						"width": 300
					},
					{
						"height": 64,
						"url": "https://i.scdn.co/image/67407947517062a649d86e06c7fa17670f7f09eb",
						"width": 64
					}
				],
				"name": "Smoke + Mirrors (Deluxe)",
				"release_date": "2015-10-30",
				"release_date_precision": "day",
				"total_tracks": 21,
				"type": "album",
				"uri": "spotify:album:6ecx4OFG0nlUMqAi9OXQER"
			},
			"artists": [
				{
					"external_urls": {
						"spotify": "https://open.spotify.com/artist/53XhwfbYqKCa1cC15pYq2q"
					},
					"href": "https://api.spotify.com/v1/artists/53XhwfbYqKCa1cC15pYq2q",
					"id": "53XhwfbYqKCa1cC15pYq2q",
					"name": "Imagine Dragons",
					"type": "artist",
					"uri": "spotify:artist:53XhwfbYqKCa1cC15pYq2q"
				}
			],
			"available_markets": null,
			"disc_number": 1,
			"duration_ms": 170066,
			"explicit": false,
			"external_ids": {
				"isrc": "USUM71414163"
			},
			"external_urls": {
				"spotify": "https://open.spotify.com/track/1lgN0A2Vki2FTON5PYq42m"
			},
			"href": "https://api.spotify.com/v1/tracks/1lgN0A2Vki2FTON5PYq42m",
			"id": "1lgN0A2Vki2FTON5PYq42m",
			"is_local": false,
			"name": "Warriors",
			"popularity": 66,
			"track_number": 18,
			"type": "track",
			"uri": "spotify:track:1lgN0A2Vki2FTON5PYq42m"
		}
	}
}

    const { result } = contohResponse
    const artworkUrl = result.apple_music.artwork.url.replace('{w}', '600').replace('{h}', '600')

    const handleOpenLink = async (url: string) => {
        const supported = await Linking.canOpenURL(url)
        if (supported) {
            await Linking.openURL(url)
        }
    }

return (
    <LinearGradient
        colors={['#FFE9D5', '#FFD4A3', '#FFB366', '#FF9F4D', '#FF8C3A']}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        style={styles.container}
    >
        <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={28} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Album Artwork */}
            <View style={styles.artworkContainer}>
                <Image
                    source={{ uri: artworkUrl }}
                    style={styles.artwork}
                />
            </View>

            {/* Song Info */}
            <View style={styles.songInfo}>
                <Text style={styles.songTitle}>{result.title}</Text>
                <Text style={styles.artistName}>{result.artist}</Text>
            </View>

            {/* Play Button with Visualizer */}
            <View style={styles.playButtonContainer}>
                {/* Audio Visualizer */}
                {isPlaying && (
                    <View style={styles.visualizerContainer}>
                        <Animated.View
                            style={[
                                styles.visualizerBar,
                                {
                                    transform: [{
                                        scaleY: bar1
                                    }]
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.visualizerBar,
                                {
                                    transform: [{
                                        scaleY: bar2
                                    }]
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.visualizerBar,
                                {
                                    transform: [{
                                        scaleY: bar3
                                    }]
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.visualizerBar,
                                {
                                    transform: [{
                                        scaleY: bar4
                                    }]
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.visualizerBar,
                                {
                                    transform: [{
                                        scaleY: bar5
                                    }]
                                }
                            ]}
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => setIsPlaying(!isPlaying)}
                >
                    <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={40}
                        color="#FF9F4D"
                    />
                </TouchableOpacity>
            </View>

            {/* Streaming Platforms */}
            <View style={styles.platformsContainer}>
                <Text style={styles.sectionTitle}>Listen on</Text>

                <TouchableOpacity
                    style={styles.platformButton}
                    onPress={() => handleOpenLink(result.apple_music.url)}
                >
                    <View style={styles.platformIcon}>
                        <FontAwesome5 name="apple" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.platformInfo}>
                        <Text style={styles.platformName}>Apple Music</Text>
                        <Text style={styles.platformDescription}>Open in Apple Music</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#6B4F3D" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.platformButton}
                    onPress={() => handleOpenLink(result.spotify.external_urls.spotify)}
                >
                    <View style={[styles.platformIcon, { backgroundColor: '#1DB954' }]}>
                        <FontAwesome5 name="spotify" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.platformInfo}>
                        <Text style={styles.platformName}>Spotify</Text>
                        <Text style={styles.platformDescription}>Open in Spotify</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#6B4F3D" />
                </TouchableOpacity>
            </View>

            {/* Song Details */}
            <View style={styles.detailsContainer}>
                <Text style={styles.sectionTitle}>Song Details</Text>
                <View style={styles.divider} />

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Album</Text>
                    <Text style={styles.detailValue}>{result.apple_music.albumName}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Released</Text>
                    <Text style={styles.detailValue}>{result.release_date}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Label</Text>
                    <Text style={styles.detailValue}>{result.label}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Genre</Text>
                    <Text style={styles.detailValue}>{result.apple_music.genreNames.join(', ')}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{result.timecode}</Text>
                </View>

                {result.apple_music.composerName && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Composer</Text>
                        <Text style={styles.detailValue}>{result.apple_music.composerName}</Text>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="add-circle-outline" size={28} color="#3D2C1E" />
                    <Text style={styles.actionButtonText}>Add to Playlist</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-social-outline" size={28} color="#3D2C1E" />
                    <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    </LinearGradient>
)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    artworkContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    artwork: {
        width: 280,
        height: 280,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    songInfo: {
        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 20,
    },
    songTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#3D2C1E',
        textAlign: 'center',
        marginBottom: 8,
    },
    artistName: {
        fontSize: 18,
        color: '#6B4F3D',
        textAlign: 'center',
    },
    playButtonContainer: {
        alignItems: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    visualizerContainer: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 100,
        width: 150,
        top: -15,
    },
    visualizerBar: {
        width: 4,
        height: 60,
        backgroundColor: '#FF9F4D',
        borderRadius: 2,
        opacity: 0.7,
    },
    playButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    platformsContainer: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#3D2C1E',
        marginBottom: 8,
    },
    divider: {
        height: 2,
        backgroundColor: '#FF9F4D',
        width: 50,
        marginBottom: 15,
        borderRadius: 2,
    },
    platformButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
    },
    platformIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    platformInfo: {
        flex: 1,
    },
    platformName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3D2C1E',
        marginBottom: 3,
    },
    platformDescription: {
        fontSize: 13,
        color: '#6B4F3D',
    },
    detailsContainer: {
        paddingHorizontal: 20,
        marginBottom: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(61, 44, 30, 0.1)',
    },
    detailLabel: {
        fontSize: 15,
        color: '#6B4F3D',
        flex: 1,
    },
    detailValue: {
        fontSize: 15,
        color: '#3D2C1E',
        flex: 2,
        textAlign: 'right',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    actionButton: {
        alignItems: 'center',
        flex: 1,
    },
    actionButtonText: {
        fontSize: 13,
        color: '#3D2C1E',
        marginTop: 8,
    },
})

export default SongResultDetail