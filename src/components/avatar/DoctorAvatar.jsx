import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { VISEMES } from 'wawa-lipsync';
import { lipsyncManager } from '../../services/lipsyncService';
import useAppStore from '../../stores/appStore';

export function DoctorAvatar(props) {
    const { nodes, materials, scene } = useGLTF('/models/64f1a714fe61576b46f27ca2.glb');
    const { animations: rawAnimations } = useGLTF('/models/animations.glb');
    const { avatarCustomization } = useAppStore();

    // Filter animation tracks to only match bones/nodes that exist in the avatar scene
    const animations = useMemo(() => {
        if (!rawAnimations || !scene) return [];
        return rawAnimations.map((clip) => {
            const filteredTracks = clip.tracks.filter((track) => {
                const nodeName = track.name.split('.')[0];
                return nodeName !== 'Armature' && (!!scene.getObjectByName(nodeName) || !!nodes[nodeName]);
            });
            const cleanClip = clip.clone();
            cleanClip.tracks = filteredTracks;
            return cleanClip;
        });
    }, [rawAnimations, scene, nodes]);

    // Dynamically clone and tint materials with avatar customization
    const customMaterials = useMemo(() => {
        if (!materials) return {};
        const { hairColor, skinTone, eyeColor, outfitColor, bottomColor } = avatarCustomization || {};

        const hairMat = materials.Wolf3D_Hair ? materials.Wolf3D_Hair.clone() : null;
        if (hairMat && hairColor) {
            hairMat.color = new THREE.Color(hairColor);
            hairMat.roughness = 0.55;
        }

        const skinMat = materials.Wolf3D_Skin ? materials.Wolf3D_Skin.clone() : null;
        if (skinMat && skinTone) {
            skinMat.color = new THREE.Color(skinTone);
        }

        const bodyMat = materials.Wolf3D_Body ? materials.Wolf3D_Body.clone() : null;
        if (bodyMat && skinTone) {
            bodyMat.color = new THREE.Color(skinTone);
        }

        const eyeMat = materials.Wolf3D_Eye ? materials.Wolf3D_Eye.clone() : null;
        if (eyeMat && eyeColor) {
            eyeMat.color = new THREE.Color(eyeColor);
        }

        const outfitTopMat = materials.Wolf3D_Outfit_Top ? materials.Wolf3D_Outfit_Top.clone() : null;
        if (outfitTopMat && outfitColor) {
            outfitTopMat.color = new THREE.Color(outfitColor);
        }

        const outfitBottomMat = materials.Wolf3D_Outfit_Bottom ? materials.Wolf3D_Outfit_Bottom.clone() : null;
        if (outfitBottomMat && bottomColor) {
            outfitBottomMat.color = new THREE.Color(bottomColor);
        }

        return {
            hair: hairMat || materials.Wolf3D_Hair,
            skin: skinMat || materials.Wolf3D_Skin,
            body: bodyMat || materials.Wolf3D_Body,
            eye: eyeMat || materials.Wolf3D_Eye,
            top: outfitTopMat || materials.Wolf3D_Outfit_Top,
            bottom: outfitBottomMat || materials.Wolf3D_Outfit_Bottom,
            teeth: materials.Wolf3D_Teeth,
            footwear: materials.Wolf3D_Outfit_Footwear
        };
    }, [materials, avatarCustomization]);

    const group = useRef();
    const { actions, mixer } = useAnimations(animations, group);
    const [animation] = useState(
        animations.find((a) => a.name === 'Idle') ? 'Idle' : animations[0]?.name
    );

    useEffect(() => {
        if (!animation || !actions[animation]) return;
        actions[animation]
            ?.reset()
            .fadeIn(mixer.stats.actions.inUse === 0 ? 0 : 0.5)
            .play();
        return () => actions[animation]?.fadeOut(0.5);
    }, [animation, actions, mixer]);

    // Cache skinned meshes with morph targets and bone references for 60fps performance
    const morphEntries = useRef([]);
    const headBoneRef = useRef(null);
    const activeVisemesRef = useRef(new Set());

    useEffect(() => {
        const list = [];
        scene.traverse((child) => {
            if (child.isSkinnedMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                list.push({
                    dict: child.morphTargetDictionary,
                    influences: child.morphTargetInfluences
                });
            }
        });
        morphEntries.current = list;
        headBoneRef.current = nodes.Head || scene.getObjectByName('Head');
    }, [scene, nodes]);

    const setMorphTarget = (target, value, speed = 0.3) => {
        const entries = morphEntries.current;
        for (let i = 0; i < entries.length; i++) {
            const { dict, influences } = entries[i];
            const index = dict[target];
            if (index !== undefined) {
                const current = influences[index];
                if (Math.abs(current - value) > 0.0005) {
                    influences[index] = THREE.MathUtils.lerp(current, value, speed);
                    if (value > 0.001 || influences[index] > 0.001) {
                        activeVisemesRef.current.add(target);
                    }
                } else if (value === 0 && current !== 0) {
                    influences[index] = 0;
                }
            }
        }
    };

    const [blink, setBlink] = useState(false);

    useFrame((state) => {
        // Blinking
        setMorphTarget('eyeBlinkLeft', blink ? 1 : 0, 0.5);
        setMorphTarget('eyeBlinkRight', blink ? 1 : 0, 0.5);

        // Process audio for lip sync
        lipsyncManager.processAudio();

        const features = lipsyncManager.features;
        const currentViseme = lipsyncManager.viseme;
        const speechState = lipsyncManager.state;

        // Dynamic volume analysis
        const volume = features?.volume || 0;
        const isSpeaking = speechState !== 'silence' && volume > 0.03;

        // Controlled mouth opening amplitude
        const targetIntensity = isSpeaking
            ? THREE.MathUtils.clamp(volume * 2.2, 0.2, 0.65)
            : 0;

        // Apply active viseme with calibrated intensity
        if (isSpeaking && currentViseme && currentViseme !== VISEMES.sil) {
            let visemeMultiplier = 1.0;
            if (currentViseme === VISEMES.aa) visemeMultiplier = 0.85;
            if (currentViseme === VISEMES.PP) visemeMultiplier = 0.9;

            const attackSpeed = speechState === 'vowel' ? 0.35 : 0.45;
            setMorphTarget(currentViseme, targetIntensity * visemeMultiplier, attackSpeed);
            activeVisemesRef.current.add(currentViseme);
        }

        // Only decay visemes that actually have non-zero influences (high performance)
        if (activeVisemesRef.current.size > 0) {
            activeVisemesRef.current.forEach((v) => {
                if (isSpeaking && v === currentViseme) return;
                setMorphTarget(v, 0, 0.25);
                
                let stillActive = false;
                const entries = morphEntries.current;
                for (let i = 0; i < entries.length; i++) {
                    const idx = entries[i].dict[v];
                    if (idx !== undefined && entries[i].influences[idx] > 0.005) {
                        stillActive = true;
                        break;
                    }
                }
                if (!stillActive) {
                    activeVisemesRef.current.delete(v);
                }
            });
        }

        // Audio-reactive subtle head micro-movement while speaking
        const headBone = headBoneRef.current;
        if (headBone && isSpeaking) {
            const nod = Math.sin(state.clock.elapsedTime * 6) * 0.02 * targetIntensity;
            const tilt = Math.sin(state.clock.elapsedTime * 3) * 0.015 * targetIntensity;
            headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, nod, 0.1);
            headBone.rotation.z = THREE.MathUtils.lerp(headBone.rotation.z, tilt, 0.1);
        }
    });

    // Blinking interval
    useEffect(() => {
        let blinkTimeout;
        const nextBlink = () => {
            blinkTimeout = setTimeout(() => {
                setBlink(true);
                setTimeout(() => {
                    setBlink(false);
                    nextBlink();
                }, 200);
            }, THREE.MathUtils.randInt(1000, 5000));
        };
        nextBlink();
        return () => clearTimeout(blinkTimeout);
    }, []);

    return (
        <group {...props} dispose={null} ref={group}>
            <primitive object={nodes.Hips} />
            <skinnedMesh name="Wolf3D_Body" geometry={nodes.Wolf3D_Body.geometry} material={customMaterials.body || materials.Wolf3D_Body} skeleton={nodes.Wolf3D_Body.skeleton} />
            <skinnedMesh name="Wolf3D_Outfit_Bottom" geometry={nodes.Wolf3D_Outfit_Bottom.geometry} material={customMaterials.bottom || materials.Wolf3D_Outfit_Bottom} skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton} />
            <skinnedMesh name="Wolf3D_Outfit_Footwear" geometry={nodes.Wolf3D_Outfit_Footwear.geometry} material={customMaterials.footwear || materials.Wolf3D_Outfit_Footwear} skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton} />
            <skinnedMesh name="Wolf3D_Outfit_Top" geometry={nodes.Wolf3D_Outfit_Top.geometry} material={customMaterials.top || materials.Wolf3D_Outfit_Top} skeleton={nodes.Wolf3D_Outfit_Top.skeleton} />
            <skinnedMesh name="Wolf3D_Hair" geometry={nodes.Wolf3D_Hair.geometry} material={customMaterials.hair || materials.Wolf3D_Hair} skeleton={nodes.Wolf3D_Hair.skeleton} />
            <skinnedMesh name="EyeLeft" geometry={nodes.EyeLeft.geometry} material={customMaterials.eye || materials.Wolf3D_Eye} skeleton={nodes.EyeLeft.skeleton} morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary} morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences} />
            <skinnedMesh name="EyeRight" geometry={nodes.EyeRight.geometry} material={customMaterials.eye || materials.Wolf3D_Eye} skeleton={nodes.EyeRight.skeleton} morphTargetDictionary={nodes.EyeRight.morphTargetDictionary} morphTargetInfluences={nodes.EyeRight.morphTargetInfluences} />
            <skinnedMesh name="Wolf3D_Head" geometry={nodes.Wolf3D_Head.geometry} material={customMaterials.skin || materials.Wolf3D_Skin} skeleton={nodes.Wolf3D_Head.skeleton} morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences} />
            <skinnedMesh name="Wolf3D_Teeth" geometry={nodes.Wolf3D_Teeth.geometry} material={customMaterials.teeth || materials.Wolf3D_Teeth} skeleton={nodes.Wolf3D_Teeth.skeleton} morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences} />
        </group>
    );
}

useGLTF.preload('/models/64f1a714fe61576b46f27ca2.glb');
useGLTF.preload('/models/animations.glb');

