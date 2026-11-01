import Peer, { DataConnection } from 'peerjs';
import { CountryId, BallEmotion, PeerChatMessage, RemotePeerState, SharedWorldData } from '../types/game';

export interface PeerNetworkCallbacks {
  onStatusChange?: (status: string, peerCode?: string) => void;
  onPeerJoin?: (peer: RemotePeerState) => void;
  onPeerLeave?: (peerId: string) => void;
  onPeerMove?: (peerState: RemotePeerState) => void;
  onChatMessage?: (msg: PeerChatMessage) => void;
  onBlockPlace?: (data: { x: number; y: number; z: number; type: string; customTextureUrl?: string }) => void;
  onBlockRemove?: (data: { x: number; y: number; z: number }) => void;
  onError?: (err: string) => void;
  onWorldInit?: (world: SharedWorldData, peers: RemotePeerState[]) => void;
}

export interface JoinServerResult {
  success: boolean;
  world?: SharedWorldData;
  peers?: RemotePeerState[];
  reason?: string;
}

export class PeerNetworkManager {
  private peer: Peer | null = null;
  public isHost = false;
  public peerCode: string = '';
  public tempPassword: string = '';
  private connections: Map<string, DataConnection> = new Map();
  public peerStates: Map<string, RemotePeerState> = new Map();
  private callbacks: PeerNetworkCallbacks = {};
  public localPlayerState: Partial<RemotePeerState> = {};
  private getWorldData?: () => SharedWorldData;

  constructor(callbacks: PeerNetworkCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Starts a Host Peer Server with a temporary password and dynamic world-getter
   */
  public startHost(password: string, getWorldData?: () => SharedWorldData): Promise<string> {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      this.tempPassword = password;
      this.getWorldData = getWorldData;
      this.peerStates.clear();

      // Generate friendly random peer code like geoclub-7892
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedCode = `geoclub-${randomSuffix}`;

      try {
        this.peer = new Peer(generatedCode, {
          debug: 1,
        });

        this.peer.on('open', (id) => {
          this.peerCode = id;
          if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange('ホスト中', id);
          }
          resolve(id);
        });

        this.peer.on('connection', (conn) => {
          this.setupHostConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.warn('Peer error:', err);
          if (this.callbacks.onError) {
            this.callbacks.onError(`Peerエラー: ${err.type}`);
          }
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  private setupHostConnection(conn: DataConnection) {
    conn.on('data', (data: any) => {
      if (!data || typeof data !== 'object') return;

      // Handle Authentication Request
      if (data.type === 'auth_request') {
        if (data.password === this.tempPassword) {
          this.connections.set(conn.peer, conn);

          const newPeerState: RemotePeerState = {
            id: conn.peer,
            name: data.name || 'ゲスト',
            country: data.country || 'japan',
            frontFlagUrl: data.frontFlagUrl,
            backFlagUrl: data.backFlagUrl,
            eyeScale: data.eyeScale || 0.8,
            eyeSpacing: data.eyeSpacing || 1.4,
            outlineThickness: data.outlineThickness || 0.095,
            position: data.position || { x: 0, y: 3, z: 0 },
            facingYaw: data.facingYaw || 0,
            emotion: data.emotion || 'normal',
          };

          // Build snapshot of existing players for this new joiner (Host + all existing peers)
          const hostPeerState: RemotePeerState = {
            id: 'host',
            name: this.localPlayerState.name || 'ホスト',
            country: this.localPlayerState.country || 'japan',
            frontFlagUrl: this.localPlayerState.frontFlagUrl,
            backFlagUrl: this.localPlayerState.backFlagUrl,
            eyeScale: this.localPlayerState.eyeScale || 0.8,
            eyeSpacing: this.localPlayerState.eyeSpacing || 1.4,
            outlineThickness: this.localPlayerState.outlineThickness || 0.095,
            position: this.localPlayerState.position || { x: 0, y: 3, z: 0 },
            facingYaw: this.localPlayerState.facingYaw || 0,
            emotion: this.localPlayerState.emotion || 'normal',
          };

          const existingPeers: RemotePeerState[] = [hostPeerState];
          for (const [id, peer] of this.peerStates.entries()) {
            if (id !== conn.peer) {
              existingPeers.push(peer);
            }
          }

          // Register new peer in host's directory
          this.peerStates.set(conn.peer, newPeerState);

          // Get fresh world data (preset, terrainSeed, placedBlocks, customBlocks)
          const worldData = this.getWorldData ? this.getWorldData() : undefined;

          // Send auth_success with full world data and all existing players
          conn.send({
            type: 'auth_success',
            hostName: this.localPlayerState.name || 'ホスト',
            world: worldData,
            peers: existingPeers,
          });

          // Notify Host local UI that a player joined
          if (this.callbacks.onPeerJoin) {
            this.callbacks.onPeerJoin(newPeerState);
          }

          // Broadcast to all other peers that this new peer joined
          this.broadcast(
            {
              type: 'peer_joined',
              peer: newPeerState,
            },
            conn.peer
          );
        } else {
          conn.send({
            type: 'auth_failed',
            reason: 'パスワードが一致しません',
          });
          setTimeout(() => conn.close(), 500);
        }
        return;
      }

      // Handle In-Game Player Movement Sync
      if (data.type === 'player_sync') {
        const updatedPeerState: RemotePeerState = {
          id: conn.peer,
          name: data.name,
          country: data.country,
          frontFlagUrl: data.frontFlagUrl,
          backFlagUrl: data.backFlagUrl,
          eyeScale: data.eyeScale || 0.8,
          eyeSpacing: data.eyeSpacing || 1.4,
          outlineThickness: data.outlineThickness || 0.095,
          position: data.position,
          facingYaw: data.facingYaw,
          emotion: data.emotion,
        };
        this.peerStates.set(conn.peer, updatedPeerState);

        if (this.callbacks.onPeerMove) {
          this.callbacks.onPeerMove(updatedPeerState);
        }
        // Relay to other clients with peer ID preserved
        this.broadcast(
          {
            type: 'player_sync',
            ...updatedPeerState,
          },
          conn.peer
        );
      } else if (data.type === 'chat') {
        if (this.callbacks.onChatMessage) {
          this.callbacks.onChatMessage(data.message);
        }
        this.broadcast(data, conn.peer);
      } else if (data.type === 'block_place') {
        const placeData = {
          x: data.x,
          y: data.y,
          z: data.z,
          type: data.blockType || data.type || 'grass',
          customTextureUrl: data.customTextureUrl,
        };
        if (this.callbacks.onBlockPlace) {
          this.callbacks.onBlockPlace(placeData);
        }
        this.broadcast(data, conn.peer);
      } else if (data.type === 'block_remove') {
        if (this.callbacks.onBlockRemove) {
          this.callbacks.onBlockRemove(data);
        }
        this.broadcast(data, conn.peer);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.peerStates.delete(conn.peer);
      if (this.callbacks.onPeerLeave) {
        this.callbacks.onPeerLeave(conn.peer);
      }
      this.broadcast({ type: 'peer_left', peerId: conn.peer });
    });
  }

  /**
   * Connects as a Client to a Host Peer Server
   */
  public joinServer(
    targetPeerCode: string,
    password: string,
    playerInfo: Partial<RemotePeerState>
  ): Promise<JoinServerResult> {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.localPlayerState = playerInfo;
      this.peerStates.clear();

      try {
        this.peer = new Peer({
          debug: 1,
        });

        const connectionTimeout = setTimeout(() => {
          if (this.callbacks.onError) {
            this.callbacks.onError('接続タイムアウト: サーバーが見つかりませんでした');
          }
          resolve({ success: false, reason: '接続タイムアウト' });
        }, 12000);

        this.peer.on('open', () => {
          const conn = this.peer!.connect(targetPeerCode.trim(), {
            reliable: true,
          });

          conn.on('open', () => {
            // Send auth request with password and local player setup
            conn.send({
              type: 'auth_request',
              password: password.trim(),
              name: playerInfo.name,
              country: playerInfo.country,
              frontFlagUrl: playerInfo.frontFlagUrl,
              backFlagUrl: playerInfo.backFlagUrl,
              eyeScale: playerInfo.eyeScale,
              eyeSpacing: playerInfo.eyeSpacing,
              outlineThickness: playerInfo.outlineThickness,
              position: playerInfo.position,
              facingYaw: playerInfo.facingYaw,
              emotion: playerInfo.emotion,
            });
          });

          conn.on('data', (data: any) => {
            if (!data || typeof data !== 'object') return;

            if (data.type === 'auth_success') {
              clearTimeout(connectionTimeout);
              this.connections.set('host', conn);
              this.peerCode = targetPeerCode;
              if (this.callbacks.onStatusChange) {
                this.callbacks.onStatusChange('サーバー接続中', targetPeerCode);
              }
              if (Array.isArray(data.peers)) {
                for (const p of data.peers) {
                  this.peerStates.set(p.id, p);
                }
              }
              if (this.callbacks.onWorldInit && data.world) {
                this.callbacks.onWorldInit(data.world, data.peers || []);
              }
              resolve({
                success: true,
                world: data.world,
                peers: data.peers,
              });
            } else if (data.type === 'auth_failed') {
              clearTimeout(connectionTimeout);
              if (this.callbacks.onError) {
                this.callbacks.onError(data.reason || 'パスワードが間違っています');
              }
              resolve({
                success: false,
                reason: data.reason || 'パスワードが間違っています',
              });
            } else if (data.type === 'peer_joined') {
              if (data.peer) {
                this.peerStates.set(data.peer.id, data.peer);
                if (this.callbacks.onPeerJoin) {
                  this.callbacks.onPeerJoin(data.peer);
                }
              }
            } else if (data.type === 'peer_left') {
              if (data.peerId) {
                this.peerStates.delete(data.peerId);
                if (this.callbacks.onPeerLeave) {
                  this.callbacks.onPeerLeave(data.peerId);
                }
              }
            } else if (data.type === 'player_sync') {
              if (data.id) {
                this.peerStates.set(data.id, data);
              }
              if (this.callbacks.onPeerMove) {
                this.callbacks.onPeerMove(data);
              }
            } else if (data.type === 'chat') {
              if (this.callbacks.onChatMessage) {
                this.callbacks.onChatMessage(data.message);
              }
            } else if (data.type === 'block_place') {
              if (this.callbacks.onBlockPlace) {
                this.callbacks.onBlockPlace({
                  x: data.x,
                  y: data.y,
                  z: data.z,
                  type: data.blockType || data.type || 'grass',
                  customTextureUrl: data.customTextureUrl,
                });
              }
            } else if (data.type === 'block_remove') {
              if (this.callbacks.onBlockRemove) {
                this.callbacks.onBlockRemove(data);
              }
            }
          });

          conn.on('error', (err) => {
            clearTimeout(connectionTimeout);
            if (this.callbacks.onError) {
              this.callbacks.onError(`接続エラー: ${err}`);
            }
            resolve({ success: false, reason: `接続エラー: ${err}` });
          });

          conn.on('close', () => {
            this.connections.clear();
            this.peerStates.clear();
            if (this.callbacks.onError) {
              this.callbacks.onError('ホストとの接続が切断されました');
            }
          });
        });

        this.peer.on('error', (err) => {
          clearTimeout(connectionTimeout);
          if (this.callbacks.onError) {
            this.callbacks.onError(`サーバー接続に失敗しました: ${err.type}`);
          }
          resolve({ success: false, reason: `サーバー接続エラー: ${err.type}` });
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  public sendPlayerSync(state: Partial<RemotePeerState>) {
    this.localPlayerState = { ...this.localPlayerState, ...state };
    this.broadcast({
      type: 'player_sync',
      id: this.isHost ? 'host' : undefined,
      ...this.localPlayerState,
    });
  }

  public sendChatMessage(text: string, senderName: string) {
    const msg: PeerChatMessage = {
      id: `chat_${Date.now()}_${Math.random()}`,
      sender: senderName,
      text,
      time: Date.now(),
    };
    if (this.callbacks.onChatMessage) {
      this.callbacks.onChatMessage(msg);
    }
    this.broadcast({
      type: 'chat',
      message: msg,
    });
  }

  public sendBlockPlace(x: number, y: number, z: number, blockType: string, customTextureUrl?: string) {
    this.broadcast({
      type: 'block_place',
      x,
      y,
      z,
      blockType,
      customTextureUrl,
    });
  }

  public sendBlockRemove(x: number, y: number, z: number) {
    this.broadcast({
      type: 'block_remove',
      x,
      y,
      z,
    });
  }

  private broadcast(data: any, excludePeerId?: string) {
    for (const [peerId, conn] of this.connections.entries()) {
      if (peerId !== excludePeerId && conn.open) {
        try {
          conn.send(data);
        } catch {
          // ignore
        }
      }
    }
  }

  public disconnect() {
    for (const conn of this.connections.values()) {
      try {
        conn.close();
      } catch {
        // ignore
      }
    }
    this.connections.clear();
    this.peerStates.clear();
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }
  }
}
