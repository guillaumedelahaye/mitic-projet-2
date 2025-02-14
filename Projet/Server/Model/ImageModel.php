<?php
class ImageModel {



	public function getImage($id,$w,$l,$c,$t){

		$file = ROOT_DATA_REPOSITORY."/img1491_mini/".$id.".jpg";
		$size = getimagesize($file);
		$res = array();

		//chargement de l'image en fonction du format
		if ($size){
			$res[0]=$size['mime'];
			if ($size['mime']=='image/jpeg' ) {
				$img_big = imagecreatefromjpeg($file); # On ouvre l'image d'origine
			}
			elseif ($size['mime']=='image/png' ) {
				$img_big = imagecreatefrompng($file); # On ouvre l'image d'origine
			}
			elseif ($size['mime']=='image/gif' ) {
				$img_big = imagecreatefromgif($file); # On ouvre l'image d'origine
			}

			if($c!=0){
				//cas du scale
				$img_new = imagecreate($size[0]*$c, $size[1]*$c);
				// création de la miniature
				$img_mini = imagecreatetruecolor($size[0]*$c, $size[1]*$c)
				or   $img_mini = imagecreate($size[0]*$c, $size[1]*$c);

				// copie de l'image, avec le redimensionnement.
				imagecopyresized($img_mini,$img_big,0,0,0,0,$size[0]*$c, $size[1]*$c,$size[0],$size[1]);
				imagedestroy($img_big);
				$res[1]=$img_mini;
			}elseif($t!=0){
				if($size[0]>$size[1]){
					$ratio = $size[1]/$size[0];
					//cas de la taille fixée
					$img_new = imagecreate($t, $t*$ratio);
					// création de la miniature
					$img_mini = imagecreatetruecolor($t, $t*$ratio)
					or   $img_mini = imagecreate($t, $t*$ratio);

					// copie de l'image, avec le redimensionnement.
					imagecopyresized($img_mini,$img_big,0,0,0,0,$t, $t*$ratio,$size[0],$size[1]);
					imagedestroy($img_big);
					$res[1]=$img_mini;
				}else{
					$ratio = $size[0]/$size[1];
					//cas de la taille fixée
					$img_new = imagecreate($t*$ratio, $t);
					// création de la miniature
					$img_mini = imagecreatetruecolor($t*$ratio, $t)
					or   $img_mini = imagecreate($t*$ratio, $t);

					// copie de l'image, avec le redimensionnement.
					imagecopyresized($img_mini,$img_big,0,0,0,0,$t*$ratio, $t,$size[0],$size[1]);
					imagedestroy($img_big);
					$res[1]=$img_mini;
				}
			}elseif($w!=0&&$l!=0){
				//cas de la taille fixée
				$img_new = imagecreate($w, $l);
				// création de la miniature
				$img_mini = imagecreatetruecolor($w, $l)
				or   $img_mini = imagecreate($w, $l);

				// copie de l'image, avec le redimensionnement.
				imagecopyresized($img_mini,$img_big,0,0,0,0,$w,$l,$size[0],$size[1]);
				imagedestroy($img_big);
				$res[1]=$img_mini;

			}else{
				//cas sans paramètres
				$res[1]=$img_big;	
			}
			return $res;
		}

	}

	// 	public function getSignificativesDistances($id,$nn){
	// 		$array = $this->getAllDistance();
	// 		$voisins_n = $this->recupererMin($id, $nn, $array);
	// 		$res = $voisins_n;
	// 		foreach ($voisins_n as $v)
	// 			$res = array_merge($res, $this->recupererMin($v[0] != $id ?$v[0]:$v[1], $nn, $array));

	// 		return $res;
	// 	}
/*
	private function recupererMin($id,$nn, &$dist){
		$keys = array();
		$res = array();
		$tid = array();
		$val = array();
		$max = 1;
		$nb = 0;
		foreach($dist as $key => $di){
			if(($di[0]==$id) || ($di[1]==$id)){
				if($nb==$nn){
					if(floatval($di[2])<floatval($max)){
						for($i =0; $i<$nn;$i++){
							if(floatval($max)==floatval($val[$i])){
								$val[$i]=$di[2];
								$tid[$i]=$di;
								$keys[$i] = $key;
								$max = max($val);
								break;
							}
						}
					}
				}else{
					$keys[] = $key;
					$tid[]=$di;
					$val[]=$di[2];
					$nb++;
					$max = max($val);
				}
			}
		}

		foreach ($keys as $key)
		unset($dist[$key]);
			
		return $tid;
	}
*/

	/*
	 public function getSignificativesDistancesV2($id,$n,$n_plus_1){
		// on lit tout le contenu du fichier (1225 lignes pour 50 points)
		$array = $this->getAllDistance();

		// on prend les $n plus proches voisins de $id
		$voisins_n = $this->voisins_n($id, $n, $array);

		$voisins_n = $this->recupererMin($id, $nn, $array);

		$res = $voisins_n;
		foreach ($voisins_n as $v)
		{
		$res = array_merge($res, $this->recupererMin($v[0] != $id ?$v[0]:$v[1], $nn, $array));
		}


		// distances par rapport � B
		// en fonction de la taille de array on d�duit le nb d'images diff�rentes
		// ici 1225 lignes -> 50 images
		$dist_b = array();
		$j = 0;
		$nb_images = (1 + sqrt(8 * sizeof($array) + 1) ) / 2;
		//var_dump($nb_images);

		for($i = $nb_images - 1; $i < (2*$nb_images - 2);  $i++)
		{
		// cas de la premiere ligne
		if($i == $nb_images - 1) $dist_b[$j] = array($id, $array[$j][2]);
		// cas des lignes d'index n � 2n-1
		var_dump($array[$i][1]);
		//else $dist_b[$j] = array($array[$i][1], $array[$i][2]);

		$j++;
		}
		var_dump($dist_b);
		//var_dump($dist_b);

		// on construit un tableau id | x | y
		// on place le premier point au centre (en 0, 0)
		$positions = array();
		$positions[0] = array($id, 0, 0);
		return null;

		}
		*/
	/*
	 // calcul l'angle
	 //	// alpha = acos ((b� - a� - c�)/-2ac)
	 private function calculeAngle($a, $b, $c)
	 {
		return acos( (pow($b,2) - pow($a, 2) - pow($c, 2)) / -2 * a*c  );
		}*/




	/*
	 public function voisins_n_plus_1($id, $nn, $nn_plus_1)
	 {
		// lecture du fichier
		$array = $this->getAllDistance();

		// extraction des voisins de $id
		$voisins_n = array();
		foreach($array as $value)
		{
		if ($value[0] == $id){
		$voisins_n[$value[1]] = $value[2];
		} else if ($value[1] == $id){
		$voisins_n[$value[0]] = $value[2];
		}
		}
		//tri croissant des longueurs
		asort($voisins_n);
		// extraction des $nn plus proches
		return array_slice($voisins_n, 0, $nn, true);
		}

		*/
}
?>