<?php
/*
 * 
 * 	Implémentation correspondant au premier contrat d'interface,
 *  A l'epoque, nous pensions que les valeurs du fichier etaient des distances alorq que c'etait en réalité des scores. 	
 * 
 *  Affichage d'un graph interconnecté
 * 
 * */
class VoisinsNPlusUnModel {

	private function getAllDistances(){
		$res = array();
		$file = file_get_contents(ROOT_DATA_REPOSITORY.SEP."50.txt");
		$distances = explode("\n", $file);

		foreach ($distances as $distance){
			$distance = trim($distance);
			if(!empty($distance)) $res[] = explode(" ", $distance);
		}
		return $res;
	}

	private function voisinsN($id, $nn, $array)
	{
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

	public function getVoisinsNPlusUn($id,$nn,$nPlusUn,$w, $h){
		// lecture du fichier
		$array = $this->getAllDistances();

		// extraction des $nn proches voisins de $id ainsi que leurs distance par rapoort � $id
		$voisins_id = $this->voisinsN($id, $nn, $array);
	//	var_dump('voisins_id');
	//	var_dump($voisins_id);

		// on construit aussi un tableau contenant uniquement les associations d'image (I.E les liens qui seront affich�s)
		$liens = array();
		$nb_liens = 0;
		// cr�ation des liens de rang n
		foreach($voisins_id as $k => $v)
		{
			$liens[$nb_liens] = array(intval($id), $k);
			$nb_liens++;
		}

		// extraction des $nPlusUn plus proches voisins des $nn plus proches voisins de $id
		$tmp = array();
		//var_dump(sizeof(array_keys($voisins_id)));
		
		foreach(array_keys($voisins_id) as $key)
		{
			$voisinsNPlusUnKeys = array_keys($this->voisinsN($key, $nPlusUn, $array));
			//var_dump(sizeof($voisinsNPlusUnKeys));
			// maintenant on va chercher la distance de ces points par rapport � $id
			foreach($voisinsNPlusUnKeys as $vNPlusUnKey)
			{
				if($vNPlusUnKey != $id)
				{
					$liens[$nb_liens] = array(intval($key), $vNPlusUnKey);
					$nb_liens++;
					foreach ($array as $a)
					{
						if( (($a[0] == $id)&&($a[1] == $vNPlusUnKey))
						|| (($a[0] == $vNPlusUnKey)&&($a[1] == $id)))
						{
							$tmp[$vNPlusUnKey] = $a[2];
// 							$liens[$nb_liens] = array(intval($key), $vNPlusUnKey);
// 							$nb_liens++;
							break;
						}
					}
												
				}
			}
			
		}
// 		var_dump($nb_liens);
// 		var_dump(sizeof($liens));
		
		// fusion avec le tableau des voisins de premier niveau
		foreach ($tmp as $key => $value)
		{
			$voisins_id[$key] = $value;
		}
		// on a maintenant dans $voisins_id toutes les images a afficher
		// ainsi que leurs distances par rapport a l'image de r�f�rence

		// maintenant, on va extraire les distances des points par rapport
		// a un deuxieme point de r�f�rence pour pouvoir ensuite utiliser le theoreme d'Al-Kachi
		// ici, le deuxieme point de r�f�rence est le plus proche voisin de $id (perte en precision a v�rifier..)
		$deuxieme_point_de_ref = array_shift(array_keys($voisins_id));// extract the first key from $voisins_id
			
		$voisins_deuxieme_point_de_ref = array();
		foreach(array_keys($voisins_id) as $key)
		{
			if($key != $deuxieme_point_de_ref)
			{
				foreach($array as $a)
				{
					if( (($a[0] == $deuxieme_point_de_ref)&&($a[1] == $key))
					|| (($a[1] == $deuxieme_point_de_ref)&&($a[0] == $key)))
					{
						$voisins_deuxieme_point_de_ref[$key] = $a[2];
						break;
					}
				}
			}
		}

		// Calcul des positions grace a theoreme d'Al-Kachi
		$positions = array();


		// on place le premier point au centre (en 0, 0)
		$positions[0] = array(intval($id), 
			0, 
			0);
		// on place le deuxieme point sur l'axe des abcisses
		$positions[1] = array($deuxieme_point_de_ref, array_shift(array_values($voisins_id)), 0);
		// ensuite grace a trigo et AlKashi on recupere angle et position du point delativement aux deux autres.
		$i = 2;
		$max = 0;
		foreach($voisins_id as $key => $value)      // voisins_id = distance des points par rapport a $id (ici le point a)
													// $key id du point $value la distance
		{
			if($key == $deuxieme_point_de_ref)continue;
			$max = $value > $max ? $value : $max; 
			// on a deja les 2 premiers points
			//if(($i == 0)||($i == 1)) { $i++;continue; }
						
			$a = $voisins_id[$deuxieme_point_de_ref];// distance par rapport au point A (0, 0)
			$b = $voisins_deuxieme_point_de_ref[$key];// distance par rapport au deuxieme point de ref B (x, 0)
			$c = $value; // distance du point a ajouter par rapport à A
			$angle = $this->calculeAngle($a, $b, $c);
			$coords = $this->coordonnesXY($angle, $c);
			
			$positions[$i] = array($key,$coords['x'], $coords['y']);
			$i++;
		}
		
		// une fois le max trouvé on applique le ratio
		// en fonction de la resolution envoyée 
		$max_screen = (min($w, $h) / 2) - 20;
		$ratio = ($max_screen ) / $max;
		foreach($positions as $key => &$value)
		{		
			$value[1] *= ($ratio);
			$value[2] *= ($ratio);
		}
		
		return array('positions' => $positions, 'liens' => $liens);
	}

	// calcul l'angle d'un nouveau point en fonction de sa distance par rapport a $id et $deuxieme_point_de_ref (not� A et B)
	//	// alpha = acos ((b² - a² - c²)/-2ac)
	private function calculeAngle($a, $b, $c)
	{
		$t = round( ($b*$b - $a*$a - $c*$c) / (-2*$a*$c), 4) ;
		return acos($t);
	}

	//Calcul l'emplacement des points pour la version v1 (étoile)
	private function coordonnesXY($angle , $distance){
		$coordonnees = array();
		$coordonnees ['x'] = round($distance * cos($angle), 4);
		$coordonnees ['y'] = round($distance * sin($angle), 4);
		return $coordonnees;
	}
}
?>