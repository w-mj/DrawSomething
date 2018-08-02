<?php
/**
 * Created by PhpStorm.
 * User: wmj
 * Date: 8/1/18
 * Time: 2:38 PM
 */

require_once __DIR__.'/vendor/autoload.php';

$maxGameRoom = 10;
$roomNumberPool = range(100, 100 + $maxGameRoom);
shuffle($roomNumberPool);
$roomList = array_fill_keys($roomNumberPool, null);  // create room number list.
$hall = array();  // to store all players

/**
 * find a free room and return its number, otherwise return null.
 * @return null|string
 */
class Player {
    public $connection;  // a user's connection is also used as its unique id.
    public $room = null;
    public $nickname = 'anonymous';
    public $score = 0;
    function __construct($connection) {
        $this->connection = $connection;
    }
}
function findFree () {
    global $roomList;
    foreach ($roomList as $num => $room) {
        if ($room == null)
            return $num;
    }
    return null;
}
class Room {
    private $roomNumber;
    private $players = array();
    private $playing = false;
    function __construct($host){  // a room must have at least one player.
        $this->roomNumber = findFree();  // new room
        global $roomList;
        if ($this->roomNumber != null)  // if find a free room successfully, put room into the list.
            $roomList[$this->roomNumber] = $this;
        $this->come($host);
    }

    public function getRoomNumber()
    {
        return $this->roomNumber;
    }

    public function come(Player $player) {
        $this->players[$player->connection>getRemoteIP()] = $player;  // A player join the room
        $player->score = 0;
        $player->room = $this;
    }

    public function leave(Player $player) {
        unset($this->players[$player->connection->getRemoteIP()]); // delete both key and value.
        if (count($this->players) == 0) {  // if all players leave the room, release.
            global $roomList;
            $roomList[$this->roomNumber] = null;
        }
    }

    public function start() {
        $this->playing = true;
        reset($this->players);
        return current($this->players);
    }

    public function nextDrawer() {
        if ($this->playing)
            return next($this->players);
        return null;
    }

    public function end() {
        $this->playing = false;
    }

    public function sendAll($msg, $type) {
        if ($type != 'raw')
            $msg = '{"'.$type.'":"'.$msg.'"}';
        foreach ($this->players as $ip => $conn) {
            $conn->send($msg);
        }
    }
}

$ws = new Workerman\Worker('websocket:127.0.0.1:9394');
$ws->onConnect = function(Workerman\Connection\TcpConnection $conn) use ($hall) {
    $hall[$conn->getRemoteIp()] = new Player($conn);
};

$ws->onClose = function(Workerman\Connection\TcpConnection $conn) use ($hall) {
    $p = $hall[$conn->getRemoteIp()];
    if ($p -> room != null)
        $p -> room -> leave($p);
    unset($hall[$conn->getRemoteIp()]);
};

$ws->onMessage = function(Workerman\Connection\TcpConnection $conn, $raw) use ($hall, $roomList) {
    $msg = json_decode($raw, true);
    $player = $hall[$conn->getRemoteIp()];
    $room = $player->room;
    switch ($msg['c']) {
        case 'rn': $hall[$conn->getRemoteIp()]->nickname = $msg['n']; break;  // rename
        case 'j':  // join
            if (array_key_exists($msg['n'], $roomList) || $roomList[$msg['n']] == null)
                $conn->send('{"err":"illegal room number"}');
            else {
                $room = $roomList[$msg['n']];
                $room->come($player);
                $room->sendAll($player->nickname . ' join the game.', 'msg');
            }
            break;
        case 's': // say
            // TODO: check correct
            $room->sendAll($msg['msg'], 'msg');
            break;
        case 'd': // draw point
            $room->sendAll($raw, 'raw');
            break;
    }
};