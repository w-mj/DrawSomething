<?php
/**
 * Created by PhpStorm.
 * User: wmj
 * Date: 8/1/18
 * Time: 2:38 PM
 */

require_once __DIR__.'/vendor/autoload.php';
use Workerman\Worker;
use Workerman\Connection\TcpConnection;

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
    public $drawing = false;
    public $ready = false;
    function __construct($connection) {
        $this->connection = $connection;
    }
    public function structure() {
        return array('n'=>$this->nickname, 's'=>$this->score, 'r'=>$this->ready);
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
    private $currentPlayer = null;
    private function __construct(){}  // private construct function.

    public static function newRoom($host) {
        $roomNumber = findFree();
        if ($roomNumber == null)
            return null;
        global $roomList;
        $room = new Room();
        $room->roomNumber = $roomNumber;
        $roomList[$roomNumber] = $room;
        $room->come($host);
        return $room;
    }

    public function getRoomNumber()
    {
        return $this->roomNumber;
    }

    public function come(Player $player) {
        $this->players[$player->connection->id] = $player;  // A player join the room
        $player->score = 0;
        $player->room = $this;
        $this->sendAll(json_encode(array('c'=>'i', 'n'=>$player->nickname)));
        $player->connection->send('{"c":"j", "r":"s", "n":'.$this->roomNumber."}");
        $this->sendPlayerList($player->connection);
    }

    public function leave(Player $player) {
        $this->sendAll('{"c":"l", "n":"'.$player->nickname.'"}');
        unset($this->players[$player->connection->id]); // delete both key and value.
        if (count($this->players) == 0) {  // if all players leave the room, release.
            global $roomList;
            $roomList[$this->roomNumber] = null;
        }
    }

    public function start() {
        $this->playing = true;
        reset($this->players);
        $this->currentPlayer = current($this->players);
        $this->currentPlayer->drawing = true;
        $this->currentPlayer->connection->send('{"c":"b"}');
        $this->sendAll('{"c":"s", "t":"game start", "n":"server"}');
        $this->sendAll('{"c":"cl"}');
    }

    public function nextDrawer() {
        if ($this->playing && $this->currentPlayer != null) {
            $this->currentPlayer->drawing = false;
            $this->currentPlayer->connection->send('{"c":"e"}');
            $this->currentPlayer = next($this->players);
            $this->currentPlayer->drawing = true;
            $this->currentPlayer->connection->send('{"c":"b"}');
            $this->sendAll('{"c":"cl"}');
        }
    }

    public function end() {
        $this->playing = false;
        $this->currentPlayer->drawing = false;
        $this->currentPlayer->connection->send('{"c":"b"}');
    }

    public function sendAll($msg) {
        foreach ($this->players as $id => $player) {
            $player->connection->send($msg);
        }
    }

    public function allReady() {
        if (sizeof($this->players) <= 1)
            return false;
        foreach ($this->players as $id => $player)
            if ($player->ready == false)
                return false;
        return true;
    }

    public function sendPlayerList($connection) {
        $player_list = [];
        foreach ($this->players as $id=>$player)
            $player_list[] = $player->structure();
        $json = json_encode(array('c'=>'p', 'p'=>$player_list));
        $connection->send($json);
    }
}

$ws = new Worker('websocket://127.0.0.1:9394');
$ws->onConnect = function(TcpConnection $conn) use (&$hall) {
    echo "A player connected, ip:".$conn->getRemoteIp().' id:'.$conn->id."\n";
    $hall[$conn->id] = new Player($conn);
};

$ws->onClose = function(TcpConnection $conn) use (&$hall) {
    $p = $hall[$conn->id];
    if ($p -> room != null)
        $p -> room -> leave($p);
    unset($hall[$conn->id]);
    echo "A player leaved, ip:".$conn->getRemoteIp().' id:'.$conn->id."\n";
};

$ws->onMessage = function(TcpConnection $conn, $raw) use (&$hall, &$roomList) {
    echo $conn->getRemoteAddress() .'  '.$raw."\n";
    $msg = json_decode($raw, true);
    $player = $hall[$conn->id];
    $room = $player->room;
    switch ($msg['c']) {
        case 'r': $hall[$conn->id]->nickname = $msg['n']; break;  // rename
        case 'j':  // join
            if (array_key_exists($msg['n'], $roomList) && $roomList[$msg['n']] != null) {
                $room = $roomList[$msg['n']];
                $room->come($player);
            }
            else {
                $conn->send('{"c":"e", "w":"no such room"}');
            }
            break;
        case 's': // say
            // TODO: check correct
            $room->sendAll(json_encode(array('c'=>'s', 't'=>$msg['t'], 'n'=>$player->nickname)));
            break;
        case 'd': // draw point
            $room->sendAll($raw);
            break;
        case 't': // timer
            $room->sendAll($raw);
            break;
        case 'c': // create room.
            $room = Room::newRoom($hall[$conn->id]);
            if ($room == null)
                $conn->send(json_encode(array('c'=>'c', 'r'=>'e', 'w'=>'room full')));
            else
                $conn->send(json_encode(array('c'=>'c', 'r'=>'s', 'n'=>$room->getRoomNumber())));
            break;
        case 'md':
        case 'mu':
        case 'mm':
        case 'sc':
        case 'sw':
        case 'cl':
            if ($player->drawing)
                $room->sendAll($raw);
            break;
        case 'sr':
            $player->ready = true;
            if ($room->allReady())
                $room->start();
            break;
        case 'to': $room->nextDrawer(); break;
    }
};
$ws->count=1;

Worker::runAll();